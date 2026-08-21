const { GoogleGenerativeAI } = require('@google/generative-ai');
const env = require('../config/env');

let genAI = null;
if (env.GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
}

/**
 * Call Gemini API with gemini-2.5-flash and parse JSON output.
 * Strips markdown code fences (```json ... ```) and handles regex fallback.
 */
const generateStructuredJSON = async (prompt) => {
  if (!genAI) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  const result = await model.generateContent(prompt);
  const text = result.response.text();

  // Strip markdown code fences if present
  let cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();

  try {
    return JSON.parse(cleaned);
  } catch (e) {
    // Regex fallback to extract first JSON object/array
    const jsonMatch = cleaned.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error(`Failed to parse Gemini JSON output: ${text.substring(0, 100)}...`);
  }
};

module.exports = {
  generateStructuredJSON,
  hasApiKey: () => !!genAI,
};
