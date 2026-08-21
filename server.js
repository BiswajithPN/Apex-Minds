/**
 * server.js — Express Backend
 * 
 * Handles:
 *  1. Resume image upload (via multer)
 *  2. Image pre-processing for OCR (via sharp — grayscale, contrast, threshold)
 *  3. Multi-pass OCR text extraction (via tesseract.js — runs locally, NO API key)
 *  4. Resume screening (via our built-in heuristic engine)
 *  5. Returns detailed JSON result with selection/rejection reasoning
 */

const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const Tesseract = require('tesseract.js');
const { screenResumeLocal } = require('./resumeScreener');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve the React frontend (static files)
app.use(express.static(path.join(__dirname, 'client')));

// Configure multer for file uploads
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + '-' + file.originalname;
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/bmp'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only image files (PNG, JPG, WEBP, BMP) are allowed.'));
        }
    },
    limits: { fileSize: 10 * 1024 * 1024 } // 10 MB limit
});


// ========================================
// IMAGE PRE-PROCESSING FOR OCR
// ========================================

/**
 * Pre-processes a resume image for optimal OCR accuracy.
 * Creates multiple processed versions and returns their paths.
 * 
 * Strategy:
 *  - Pass 1: High-contrast grayscale (good for colored text on white bg)
 *  - Pass 2: Binary threshold (good for text on colored backgrounds)
 *  - Pass 3: Inverted threshold (good for white text on dark backgrounds)
 */
async function preprocessImage(inputPath) {
    const baseName = path.basename(inputPath, path.extname(inputPath));
    const processedPaths = [];
    
    // Get image metadata to determine optimal sizing
    const metadata = await sharp(inputPath).metadata();
    const targetWidth = Math.max(metadata.width || 2000, 2000); // Upscale small images
    
    // Pass 1: Grayscale + high contrast + sharpen
    const pass1Path = path.join(uploadDir, `${baseName}_pass1.png`);
    await sharp(inputPath)
        .resize({ width: targetWidth, withoutEnlargement: false })
        .grayscale()
        .normalize()                    // Auto-contrast
        .sharpen({ sigma: 1.5 })        // Sharpen text edges
        .modulate({ brightness: 1.1 })  // Slightly brighten
        .png()
        .toFile(pass1Path);
    processedPaths.push(pass1Path);
    
    // Pass 2: Aggressive threshold (binarize — pure black/white)
    const pass2Path = path.join(uploadDir, `${baseName}_pass2.png`);
    await sharp(inputPath)
        .resize({ width: targetWidth, withoutEnlargement: false })
        .grayscale()
        .normalize()
        .threshold(140)                 // Convert to pure black & white
        .png()
        .toFile(pass2Path);
    processedPaths.push(pass2Path);
    
    // Pass 3: Lower threshold (catches lighter text)
    const pass3Path = path.join(uploadDir, `${baseName}_pass3.png`);
    await sharp(inputPath)
        .resize({ width: targetWidth, withoutEnlargement: false })
        .grayscale()
        .normalize()
        .threshold(100)                 // Lower threshold for lighter text
        .sharpen({ sigma: 2 })
        .png()
        .toFile(pass3Path);
    processedPaths.push(pass3Path);
    
    return processedPaths;
}

/**
 * Runs Tesseract OCR on a single image with optimized settings.
 */
async function runOCR(imagePath) {
    const { data: { text } } = await Tesseract.recognize(imagePath, 'eng', {
        logger: m => {
            if (m.status === 'recognizing text') {
                process.stdout.write(`\r   OCR Progress: ${Math.round(m.progress * 100)}%`);
            }
        }
    });
    return text || '';
}

/**
 * Cleans OCR text — removes junk characters, fixes common OCR mistakes.
 */
function cleanOCRText(text) {
    let cleaned = text;
    
    // Remove non-printable characters except newlines
    cleaned = cleaned.replace(/[^\x20-\x7E\n]/g, ' ');
    
    // Collapse excessive whitespace
    cleaned = cleaned.replace(/[ \t]+/g, ' ');
    
    // Remove lines that are just noise (very short, only special chars)
    cleaned = cleaned.split('\n')
        .map(line => line.trim())
        .filter(line => {
            if (line.length < 2) return false;
            // Keep line only if it has at least 2 letter characters
            const letterCount = (line.match(/[a-zA-Z]/g) || []).length;
            return letterCount >= 2;
        })
        .join('\n');
    
    return cleaned;
}

/**
 * Merges multiple OCR results to get the best text.
 * Uses a line-by-line voting system: for each position, pick the
 * longest/cleanest version of the line.
 */
function mergeOCRResults(texts) {
    // Collect all unique meaningful lines from all passes
    const allLines = new Set();
    
    for (const text of texts) {
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        for (const line of lines) {
            allLines.add(line);
        }
    }
    
    // Sort lines and remove near-duplicates (keep the longer/cleaner version)
    const lineArray = [...allLines];
    const finalLines = [];
    const used = new Set();
    
    for (let i = 0; i < lineArray.length; i++) {
        if (used.has(i)) continue;
        
        let bestLine = lineArray[i];
        
        for (let j = i + 1; j < lineArray.length; j++) {
            if (used.has(j)) continue;
            
            // Check if lines are similar (one contains most of the other)
            const similarity = computeSimilarity(lineArray[i], lineArray[j]);
            if (similarity > 0.6) {
                // Keep the longer/more letter-rich version
                const lettersI = (lineArray[i].match(/[a-zA-Z]/g) || []).length;
                const lettersJ = (lineArray[j].match(/[a-zA-Z]/g) || []).length;
                if (lettersJ > lettersI) {
                    bestLine = lineArray[j];
                }
                used.add(j);
            }
        }
        
        finalLines.push(bestLine);
        used.add(i);
    }
    
    return finalLines.join('\n');
}

/**
 * Computes word-level similarity between two strings (Jaccard similarity).
 */
function computeSimilarity(a, b) {
    const wordsA = new Set(a.toLowerCase().split(/\s+/).filter(w => w.length > 2));
    const wordsB = new Set(b.toLowerCase().split(/\s+/).filter(w => w.length > 2));
    
    if (wordsA.size === 0 && wordsB.size === 0) return 1;
    if (wordsA.size === 0 || wordsB.size === 0) return 0;
    
    let intersection = 0;
    for (const w of wordsA) {
        if (wordsB.has(w)) intersection++;
    }
    
    return intersection / Math.min(wordsA.size, wordsB.size);
}


// ========================================
// IDENTITY REDACTION
// ========================================

/**
 * Redacts identity-related information from OCR text and tracks what was removed.
 */
function redactIdentityFields(text) {
    let redacted = text;
    let redactionLogSet = new Set();

    if (/(\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/.test(redacted)) {
        redactionLogSet.add('Removed Phone Number');
        redacted = redacted.replace(/(\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/g, '[REDACTED_PHONE]');
    }

    if (/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(redacted)) {
        redactionLogSet.add('Removed Email Address');
        redacted = redacted.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[REDACTED_EMAIL]');
    }

    if (/https?:\/\/[^\s]+/.test(redacted)) {
        redactionLogSet.add('Removed URL');
        redacted = redacted.replace(/https?:\/\/[^\s]+/g, '[REDACTED_URL]');
    }

    if (/\b[A-Z][a-z]+(?:\s[A-Z][a-z]+)?,\s*[A-Z]{2}\s*\d{5}(?:-\d{4})?\b/.test(redacted)) {
        redactionLogSet.add('Removed Physical Address');
        redacted = redacted.replace(/\b[A-Z][a-z]+(?:\s[A-Z][a-z]+)?,\s*[A-Z]{2}\s*\d{5}(?:-\d{4})?\b/g, '[REDACTED_ADDRESS]');
    }

    // Pronoun Scrubbing
    if (/\b(he|him|his|she|her|hers)\b/i.test(redacted)) {
        redactionLogSet.add('Removed Gender Pronouns');
        redacted = redacted.replace(/\b(he|him|his|she|her|hers)\b/gi, '[REDACTED_GENDER]');
    }

    // Ageism Prevention (Years 1990-2030 near degree keywords)
    const degreeRegex = /\b(bachelor|b\.s\.|b\.a\.|master|m\.s\.|m\.a\.|phd|degree|b\.tech|m\.tech|class of|graduated)\b[\s\S]{0,40}?\b(199\d|20[0-2]\d|2030)\b|\b(199\d|20[0-2]\d|2030)\b[\s\S]{0,40}?\b(bachelor|b\.s\.|b\.a\.|master|m\.s\.|m\.a\.|phd|degree|b\.tech|m\.tech)\b/gi;
    let ageismFound = false;
    redacted = redacted.replace(degreeRegex, (match) => {
        ageismFound = true;
        return match.replace(/\b(199\d|20[0-2]\d|2030)\b/g, '[REDACTED_DATE]');
    });
    if (ageismFound) {
        redactionLogSet.add('Removed Graduation Dates');
    }

    // Pedigree Stripping
    const pedigreeRegex = /\b([a-zA-Z]+(?:\s+[a-zA-Z]+)?)\s+(University|College|Institute)\b/gi;
    if (pedigreeRegex.test(redacted)) {
        redactionLogSet.add('Removed University Name');
        redacted = redacted.replace(pedigreeRegex, '[REDACTED_UNIVERSITY]');
    }

    return { redactedText: redacted, redactionLog: Array.from(redactionLogSet) };
}


// ========================================
// DECISION GENERATION
// ========================================

/**
 * Generates a human-readable selection/rejection explanation and a detailed narrative report.
 */
function generateDecision(result) {
    const { matchScore, matchedSkills, missingSkills, experience, education, adjacentSkills, decision: finalDecision } = result;

    let decision = finalDecision;
    let reasons = [];

    // Positive reasons
    if (matchedSkills.length > 0) {
        const skillsList = matchedSkills.map(s => s.skill).join(', ');
        reasons.push(`✅ Has ${matchedSkills.length} of the required skills: ${skillsList}.`);
    }
    if (adjacentSkills.length > 0) {
        const adjList = adjacentSkills.map(s => `${s.have} (for ${s.wanted})`).join(', ');
        reasons.push(`💡 Has ${adjacentSkills.length} highly transferable adjacent skills: ${adjList}.`);
    }
    if (experience.totalYearsCalculated > 0) {
        reasons.push(`✅ Candidate has ${experience.totalYearsCalculated} years of experience.`);
    }
    if (education.meetsRequirement) {
        reasons.push(`✅ Education requirement met (${education.degree}).`);
    }

    // Negative reasons
    if (missingSkills.length > 0) {
        const missingList = missingSkills.map(s => s.skill).join(', ');
        reasons.push(`❌ Missing required skills: ${missingList}.`);
    }
    if (experience.totalYearsCalculated === 0) {
        reasons.push(`❌ Could not find relevant experience.`);
    }
    if (!education.meetsRequirement) {
        reasons.push(`❌ Education requirement not met or not detected.`);
    }

    // Generate Comprehensive Narrative Report
    let narrative = `Based on an exhaustive analysis of the candidate's resume against the job requirements, here is the detailed evaluation:\n\n`;

    narrative += `**Candidate Profile Overview:**\n`;
    narrative += `The candidate possesses ${experience.totalYearsCalculated} years of detectable relevant experience. `;
    if (education.meetsRequirement) {
        narrative += `They meet the baseline educational requirements, successfully displaying a relevant degree (${education.degree}) on their resume. `;
    } else {
        narrative += `No matching educational requirements were clearly identified in the parsed text. `;
    }

    narrative += `\n\n**Skills Match Analysis:**\n`;
    if (matchedSkills.length > 0) {
        const skillsList = matchedSkills.map(s => s.skill).join(', ');
        narrative += `The candidate demonstrates proficiency in several key areas requested by the job description, specifically: ${skillsList}. This indicates a solid foundation in these core technologies. `;
    } else {
        narrative += `Critically, the candidate's resume does not explicitly demonstrate any of the specific technical skills required for this role. `;
    }
    
    if (adjacentSkills.length > 0) {
        narrative += `They also possess highly transferable adjacent skills, such as ${adjacentSkills.map(s => s.have).join(', ')}, which should make upskilling relatively swift. `;
    }

    if (missingSkills.length > 0) {
        const missingList = missingSkills.map(s => s.skill).join(', ');
        narrative += `However, there are notable gaps in their technical profile. The screening engine could not identify evidence of the following required skills: ${missingList}. `;
    }

    if (result.certifications && result.certifications.length > 0) {
        narrative += `\n\n**Certifications:**\n`;
        narrative += `The candidate holds the following relevant certifications: ${result.certifications.map(c => c.name).join(', ')}.`;
    }

    narrative += `\n\n**Final Recommendation & Rationale:**\n`;
    narrative += result.reasoning + " ";
    if (matchScore >= 70) {
        narrative += `With a strong match score of ${matchScore}/100, this candidate is highly recommended for the next round of interviews.`;
    } else if (matchScore >= 50) {
        narrative += `Achieving a moderate score of ${matchScore}/100, this candidate shows potential but has identifiable gaps. A technical screening is recommended.`;
    } else {
        narrative += `Given the low match score of ${matchScore}/100, this candidate is not recommended for this specific role at this time.`;
    }
    
    if (result.biasFlags && result.biasFlags.note) {
        narrative += `\n\n*Note: ${result.biasFlags.note}*`;
    }

    return { decision, reasons, comprehensiveReport: narrative };
}


// ========================================
// API ROUTE: Screen a resume image
// ========================================
app.post('/api/screen-resume', upload.single('resumeImage'), async (req, res) => {
    const filesToCleanup = [];
    
    try {
        const jobDescription = req.body.jobDescription;

        if (!jobDescription || jobDescription.trim().length === 0) {
            return res.status(400).json({ error: 'Job description is required.' });
        }
        if (!req.file) {
            return res.status(400).json({ error: 'Resume image file is required.' });
        }

        const imagePath = req.file.path;
        filesToCleanup.push(imagePath);

        // Step 1: Pre-process image for OCR
        console.log('\n📸 Pre-processing image for OCR...');
        const processedPaths = await preprocessImage(imagePath);
        filesToCleanup.push(...processedPaths);
        console.log(`   Created ${processedPaths.length} pre-processed versions.`);

        // Step 2: Run OCR on all processed versions (multi-pass)
        console.log('🔍 Running multi-pass OCR...');
        const ocrResults = [];
        
        for (let i = 0; i < processedPaths.length; i++) {
            console.log(`\n   Pass ${i + 1}/${processedPaths.length}:`);
            const text = await runOCR(processedPaths[i]);
            const cleaned = cleanOCRText(text);
            ocrResults.push(cleaned);
            console.log(`\n   Pass ${i + 1} extracted ${cleaned.length} chars.`);
        }

        // Step 3: Merge all OCR results for best accuracy
        console.log('\n🔗 Merging OCR results...');
        const mergedText = mergeOCRResults(ocrResults);
        console.log(`   Final merged text: ${mergedText.length} chars.`);

        if (!mergedText || mergedText.trim().length < 20) {
            return res.status(400).json({ error: 'Could not extract sufficient text from the image. Please upload a clearer resume photo.' });
        }

        // Step 4: Redact identity fields
        const { redactedText, redactionLog } = redactIdentityFields(mergedText);

        // Step 5: Screen the resume
        console.log('📊 Screening resume...');
        const screeningResult = screenResumeLocal(jobDescription, redactedText, redactionLog);

        // Step 6: Generate human-readable decision
        const { decision, reasons, comprehensiveReport } = generateDecision(screeningResult);

        console.log(`\n✅ Done! Score: ${screeningResult.matchScore}/100 | ${decision}\n`);

        // Return complete response
        res.json({
            ...screeningResult,
            decision,
            reasons,
            comprehensiveReport,
            extractedText: redactedText
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error: ' + error.message });
    } finally {
        // Cleanup all temp files
        for (const f of filesToCleanup) {
            try { if (fs.existsSync(f)) fs.unlinkSync(f); } catch (e) { /* ignore */ }
        }
    }
});


// ========================================
// BATCH PROCESSING OPTIMIZATIONS
// ========================================

/**
 * Super-fast single-pass preprocessing designed for batch execution.
 * Downscales slightly and binarizes for rapid OCR.
 */
async function preprocessImageFast(inputPath) {
    const baseName = path.basename(inputPath, path.extname(inputPath));
    const passPath = path.join(uploadDir, `${baseName}_fast_pass.png`);
    
    await sharp(inputPath)
        .resize({ width: 1500, withoutEnlargement: true }) // Smaller target for faster OCR
        .grayscale()
        .normalize()
        .threshold(128)
        .png()
        .toFile(passPath);
        
    return passPath;
}

/**
 * Concurrency Limiter for Batch Tasks
 */
async function asyncPool(poolLimit, array, iteratorFn) {
    const ret = [];
    const executing = [];
    for (const item of array) {
        const p = Promise.resolve().then(() => iteratorFn(item, array));
        ret.push(p);
        
        if (poolLimit <= array.length) {
            const e = p.then(() => executing.splice(executing.indexOf(e), 1));
            executing.push(e);
            if (executing.length >= poolLimit) {
                await Promise.race(executing);
            }
        }
    }
    return Promise.all(ret);
}

// ========================================
// API ROUTE: Screen Batch of Resumes (10 to 120+)
// ========================================
app.post('/api/screen-batch', upload.array('resumeImages', 150), async (req, res) => {
    const filesToCleanup = [];
    
    try {
        const jobDescription = req.body.jobDescription;
        const topK = parseInt(req.body.topK) || 10; // Default to returning top 10

        if (!jobDescription || jobDescription.trim().length === 0) {
            return res.status(400).json({ error: 'Job description is required.' });
        }
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'At least one resume image is required.' });
        }

        console.log(`\n🚀 Starting Batch Processing for ${req.files.length} resumes...`);
        const startTime = Date.now();

        // 1. Preprocess all images in parallel (Sharp is fast, no strict limit needed)
        const preprocessPromises = req.files.map(async (file) => {
            filesToCleanup.push(file.path);
            const processedPath = await preprocessImageFast(file.path);
            filesToCleanup.push(processedPath);
            return { originalName: file.originalname, processedPath };
        });
        const imagesToOcr = await Promise.all(preprocessPromises);

        // 2. OCR & Screen (Concurrency limited to 4 to prevent RAM/CPU crash)
        const CONCURRENCY_LIMIT = 4; 
        
        const results = await asyncPool(CONCURRENCY_LIMIT, imagesToOcr, async (img) => {
            try {
                // Single fast OCR pass
                const text = await runOCR(img.processedPath);
                const cleaned = cleanOCRText(text);
                
                if (!cleaned || cleaned.trim().length < 20) {
                    return { filename: img.originalName, error: 'Insufficient text extracted' };
                }

                // Redact and Screen
                const { redactedText, redactionLog } = redactIdentityFields(cleaned);
                const screeningResult = screenResumeLocal(jobDescription, redactedText, redactionLog);
                const { decision, reasons, comprehensiveReport } = generateDecision(screeningResult);

                return {
                    filename: img.originalName,
                    matchScore: screeningResult.matchScore,
                    decision,
                    reasons,
                    comprehensiveReport,
                    ...screeningResult
                };
            } catch (err) {
                return { filename: img.originalName, error: err.message };
            }
        });

        // 3. Filter valid results, Sort by score descending, and slice Top K
        const validResults = results.filter(r => !r.error);
        const errors = results.filter(r => r.error);
        
        validResults.sort((a, b) => b.matchScore - a.matchScore);
        const topCandidates = validResults.slice(0, topK);

        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`✅ Batch complete in ${duration}s. Processed ${validResults.length} successfully.`);

        res.json({
            totalProcessed: req.files.length,
            successCount: validResults.length,
            errorCount: errors.length,
            processingTimeSeconds: parseFloat(duration),
            topCandidates,
            errors
        });

    } catch (error) {
        console.error('Batch Error:', error);
        res.status(500).json({ error: 'Internal batch error: ' + error.message });
    } finally {
        // Cleanup all temp files to free disk space
        for (const f of filesToCleanup) {
            try { if (fs.existsSync(f)) fs.unlinkSync(f); } catch (e) { /* ignore */ }
        }
    }
});

// ========================================
// API ROUTE: Screen resume from pasted text (no image)
// ========================================
app.post('/api/screen-resume-text', (req, res) => {
    try {
        const { jobDescription, resumeText } = req.body;

        if (!jobDescription || jobDescription.trim().length === 0) {
            return res.status(400).json({ error: 'Job description is required.' });
        }
        if (!resumeText || resumeText.trim().length === 0) {
            return res.status(400).json({ error: 'Resume text is required.' });
        }

        const { redactedText, redactionLog } = redactIdentityFields(resumeText);
        const screeningResult = screenResumeLocal(jobDescription, redactedText, redactionLog);
        const { decision, reasons, comprehensiveReport } = generateDecision(screeningResult);

        res.json({
            ...screeningResult,
            decision,
            reasons,
            comprehensiveReport,
            extractedText: redactedText
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error: ' + error.message });
    }
});

// ========================================
// API ROUTE: Audit Job Description
// ========================================
app.post('/api/audit-jd', (req, res) => {
    try {
        const jd = req.body.jobDescription || '';
        
        const exclusionaryWords = {
            'ninja': 'developer or engineer',
            'rockstar': 'top performer or expert',
            'aggressive': 'driven or proactive',
            'dominate': 'lead or excel in',
            'hacker': 'security specialist or developer'
        };

        const flaggedWords = [];
        let score = 100;
        const lowerJd = jd.toLowerCase();

        for (const [word, suggestion] of Object.entries(exclusionaryWords)) {
            const regex = new RegExp('\\b' + word + '\\b', 'i');
            if (regex.test(lowerJd)) {
                flaggedWords.push({ word, suggestion });
                score -= 20;
            }
        }

        res.json({
            inclusivityScore: Math.max(0, score),
            flaggedWords
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error: ' + error.message });
    }
});

// Serve the frontend for any other routes (Express 5 syntax)
app.get('/{*splat}', (req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`\n🚀 Resume Screener Server running at http://localhost:${PORT}`);
    console.log(`   No API keys required — all processing is local!\n`);
});
