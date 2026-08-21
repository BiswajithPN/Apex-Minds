/**
 * test_api.js — Tests the /api/screen-resume endpoint with the uploaded resume image.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const imagePath = String.raw`C:\Users\GOBI KRISHNA V\.gemini\antigravity\brain\b440f287-6692-4ea3-9e86-0785826cd19c\.user_uploaded\media_1787306023939.png`;

const jobDescription = `We are looking for a Software Engineer with at least 3 years of experience.
Required Skills: Python, Java, JavaScript, React, Node.js, MongoDB, AWS.
Education: Bachelor's degree in Computer Science.`;

const boundary = '----TestBoundary' + Date.now();
const CRLF = '\r\n';

// Build multipart body
const fileContent = fs.readFileSync(imagePath);

let body = '';
// Job description field
body += `--${boundary}${CRLF}`;
body += `Content-Disposition: form-data; name="jobDescription"${CRLF}${CRLF}`;
body += jobDescription + CRLF;

// File field header
body += `--${boundary}${CRLF}`;
body += `Content-Disposition: form-data; name="resumeImage"; filename="resume.png"${CRLF}`;
body += `Content-Type: image/png${CRLF}${CRLF}`;

const bodyStart = Buffer.from(body, 'utf-8');
const bodyEnd = Buffer.from(`${CRLF}--${boundary}--${CRLF}`, 'utf-8');

const fullBody = Buffer.concat([bodyStart, fileContent, bodyEnd]);

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/screen-resume',
    method: 'POST',
    headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': fullBody.length
    }
};

console.log('📤 Uploading resume image to /api/screen-resume...');
console.log(`   Image: ${imagePath}`);
console.log('   (OCR may take 15-30 seconds...)\n');

const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        console.log(`📥 Response Status: ${res.statusCode}\n`);
        try {
            const result = JSON.parse(data);
            console.log(JSON.stringify(result, null, 2));
        } catch (e) {
            console.log('Raw response:', data);
        }
    });
});

req.on('error', (e) => {
    console.error('❌ Request failed:', e.message);
    console.error('   Is the server running? Start it with: node server.js');
});

req.write(fullBody);
req.end();
