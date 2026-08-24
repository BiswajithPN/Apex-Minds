/**
 * semanticMatchingService.js — Semantic & Text Similarity Engine
 * 
 * Integrates:
 * 1. TF-IDF vectorization & Cosine Similarity
 * 2. Jaccard Token Similarity
 * 3. Dense Domain Concept Embeddings (JavaScript-compatible vector space model)
 *    Recognizes conceptual equivalence (e.g. "Machine Learning Engineer" <-> "Developed predictive models using Python & scikit-learn")
 */

const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren\'t', 'as', 'at',
  'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by', 'can\'t', 'cannot', 'could',
  'couldn\'t', 'did', 'didn\'t', 'do', 'does', 'doesn\'t', 'doing', 'don\'t', 'down', 'during', 'each', 'few', 'for',
  'from', 'further', 'had', 'hadn\'t', 'has', 'hasn\'t', 'have', 'haven\'t', 'having', 'he', 'he\'d', 'he\'ll', 'he\'s',
  'her', 'here', 'here\'s', 'hers', 'herself', 'him', 'himself', 'his', 'how', 'how\'s', 'i', 'i\'d', 'i\'ll', 'i\'m',
  'i\'ve', 'if', 'in', 'into', 'is', 'isn\'t', 'it', 'it\'s', 'its', 'itself', 'let\'s', 'me', 'more', 'most', 'mustn\'t',
  'my', 'myself', 'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'ought', 'our', 'ours',
  'ourselves', 'out', 'over', 'own', 'same', 'shan\'t', 'she', 'she\'d', 'she\'ll', 'she\'s', 'should', 'shouldn\'t',
  'so', 'some', 'such', 'than', 'that', 'that\'s', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there',
  'there\'s', 'these', 'they', 'they\'d', 'they\'ll', 'they\'re', 'they\'ve', 'this', 'those', 'through', 'to', 'too',
  'under', 'until', 'up', 'very', 'was', 'wasn\'t', 'we', 'we\'d', 'we\'ll', 'we\'re', 'we\'ve', 'were', 'weren\'t',
  'what', 'what\'s', 'when', 'when\'s', 'where', 'where\'s', 'which', 'while', 'who', 'who\'s', 'whom', 'why', 'why\'s',
  'with', 'won\'t', 'would', 'wouldn\'t', 'you', 'you\'d', 'you\'ll', 'you\'re', 'you\'ve', 'your', 'yours', 'yourself',
  'yourselves'
]);

// Conceptual Domain Semantic Vector Map (Dense Concept Embeddings)
const DOMAIN_CONCEPT_EMBEDDINGS = {
  'machine learning': ['predictive', 'models', 'scikit-learn', 'tensorflow', 'pytorch', 'deep learning', 'neural', 'regression', 'classification', 'nlp', 'data science', 'pandas', 'numpy', 'ai', 'algorithms', 'training', 'inference'],
  'artificial intelligence': ['machine learning', 'deep learning', 'llm', 'generative ai', 'neural network', 'transformers', 'gpt', 'vision', 'reinforcement'],
  'frontend': ['react', 'vue', 'angular', 'svelte', 'ui', 'ux', 'html', 'css', 'javascript', 'typescript', 'tailwind', 'bootstrap', 'responsive', 'web application', 'components', 'dom'],
  'backend': ['node', 'express', 'django', 'flask', 'fastapi', 'spring', 'asp.net', 'rest api', 'graphql', 'server', 'microservices', 'database', 'sql', 'nosql', 'authentication', 'endpoints'],
  'full stack': ['frontend', 'backend', 'database', 'rest api', 'react', 'node.js', 'express', 'mongodb', 'sql', 'full-stack', 'client-server'],
  'cloud / devops': ['aws', 'azure', 'gcp', 'docker', 'kubernetes', 'container', 'ci/cd', 'pipeline', 'terraform', 'infrastructure', 'ansible', 'jenkins', 'cloud', 'linux', 'deploy', 'helm'],
  'database': ['sql', 'nosql', 'mongodb', 'postgresql', 'mysql', 'redis', 'elasticsearch', 'queries', 'schema', 'indexing', 'crud', 'data modeling', 'acid'],
  'mobile': ['react native', 'flutter', 'ios', 'android', 'swift', 'kotlin', 'mobile app', 'xcode', 'apk'],
  'security': ['oauth', 'jwt', 'cybersecurity', 'encryption', 'ssl', 'tls', 'penetration', 'vulnerability', 'auth', 'cors', 'xss', 'csrf'],
  'distributed systems': ['microservices', 'kafka', 'rabbitmq', 'event-driven', 'grpc', 'pubsub', 'scalability', 'high-availability', 'sharding', 'caching']
};

/**
 * Tokenize and normalize text
 */
function tokenize(text) {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^a-zA-Z0-9#+.]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w));
}

/**
 * Calculate Jaccard Similarity: |A ∩ B| / |A ∪ B|
 */
function calculateJaccardSimilarity(textA, textB) {
  const tokensA = new Set(tokenize(textA));
  const tokensB = new Set(tokenize(textB));

  if (tokensA.size === 0 || tokensB.size === 0) return 0;

  const intersection = new Set([...tokensA].filter((x) => tokensB.has(x)));
  const union = new Set([...tokensA, ...tokensB]);

  return union.size > 0 ? intersection.size / union.size : 0;
}

/**
 * Calculate TF-IDF Vector Cosine Similarity
 */
function calculateTfIdfCosineSimilarity(textA, textB) {
  const tokensA = tokenize(textA);
  const tokensB = tokenize(textB);

  if (tokensA.length === 0 || tokensB.length === 0) return 0;

  const tfA = {};
  for (const t of tokensA) tfA[t] = (tfA[t] || 0) + 1;

  const tfB = {};
  for (const t of tokensB) tfB[t] = (tfB[t] || 0) + 1;

  const allWords = Array.from(new Set([...Object.keys(tfA), ...Object.keys(tfB)]));

  // Compute document frequencies across the pair
  let dotProduct = 0;
  let magA = 0;
  let magB = 0;

  for (const w of allWords) {
    // Inverse document frequency weight
    const df = (tfA[w] ? 1 : 0) + (tfB[w] ? 1 : 0);
    const idf = Math.log((2 + 1) / (df + 1)) + 1;

    const vA = (tfA[w] || 0) * idf;
    const vB = (tfB[w] || 0) * idf;

    dotProduct += vA * vB;
    magA += vA * vA;
    magB += vB * vB;
  }

  return (magA > 0 && magB > 0) ? (dotProduct / (Math.sqrt(magA) * Math.sqrt(magB))) : 0;
}

/**
 * Dense Semantic Concept Embedding Alignment
 * Recognizes semantic relatedness across job requirements and resume descriptions
 */
function matchKeyword(k, text) {
  if (!k || !text) return false;
  const escaped = k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const rx = new RegExp(`(?<=[^a-zA-Z0-9#+]|^)${escaped}(?=[^a-zA-Z0-9#+]|$)`, 'i');
  return rx.test(text);
}

/**
 * Dense Semantic Concept Embedding Alignment
 * Evaluates domain concept vector cosine in conceptual embedding space
 */
function calculateConceptEmbeddingSimilarity(jdText, resumeText) {
  const jdLower = (jdText || '').toLowerCase();
  const resumeLower = (resumeText || '').toLowerCase();

  const domainNames = Object.keys(DOMAIN_CONCEPT_EMBEDDINGS);
  const jdVector = [];
  const resumeVector = [];
  const sharedConcepts = [];

  for (const domain of domainNames) {
    const keywords = DOMAIN_CONCEPT_EMBEDDINGS[domain];
    
    let jdCount = 0;
    if (matchKeyword(domain, jdLower)) jdCount += 2;
    for (const kw of keywords) {
      if (matchKeyword(kw, jdLower)) jdCount += 1;
    }

    let resumeCount = 0;
    if (matchKeyword(domain, resumeLower)) resumeCount += 2;
    const matchedKws = [];
    for (const kw of keywords) {
      if (matchKeyword(kw, resumeLower)) {
        resumeCount += 1;
        matchedKws.push(kw);
      }
    }

    jdVector.push(jdCount);
    resumeVector.push(resumeCount);

    if (jdCount > 0 && resumeCount > 0) {
      sharedConcepts.push({
        domain,
        matchedKeywords: matchedKws.slice(0, 5)
      });
    }
  }

  // Calculate Vector Cosine Similarity in Concept Space
  let dotProduct = 0;
  let magJd = 0;
  let magResume = 0;

  for (let i = 0; i < domainNames.length; i++) {
    dotProduct += jdVector[i] * resumeVector[i];
    magJd += jdVector[i] * jdVector[i];
    magResume += resumeVector[i] * resumeVector[i];
  }

  const conceptCosine = (magJd > 0 && magResume > 0)
    ? (dotProduct / (Math.sqrt(magJd) * Math.sqrt(magResume)))
    : 0.5;

  return {
    domainScore: parseFloat(conceptCosine.toFixed(3)),
    sharedConcepts
  };
}

/**
 * Calculate Comprehensive Semantic Score (0–100)
 */
function calculateSemanticScore(jobDescription, resumeText) {
  const jaccard = calculateJaccardSimilarity(jobDescription, resumeText);
  const tfidfCosine = calculateTfIdfCosineSimilarity(jobDescription, resumeText);
  const { domainScore, sharedConcepts } = calculateConceptEmbeddingSimilarity(jobDescription, resumeText);

  // Composite formula: Concept Space Cosine (70%) + TF-IDF Cosine (20%) + Jaccard (10%)
  const rawScore = (domainScore * 75) + (tfidfCosine * 15) + (jaccard * 10);
  const normalizedScore = Math.min(100, Math.max(10, Math.round(rawScore)));

  return {
    semanticScore: normalizedScore,
    textSimilarity: {
      tfidfCosine: parseFloat(tfidfCosine.toFixed(3)),
      jaccard: parseFloat(jaccard.toFixed(3)),
      conceptAlignment: domainScore,
    },
    sharedConcepts
  };
}

module.exports = {
  tokenize,
  calculateJaccardSimilarity,
  calculateTfIdfCosineSimilarity,
  calculateConceptEmbeddingSimilarity,
  calculateSemanticScore
};
