const { GoogleGenAI } = require("@google/genai");
require("dotenv").config();

async function listModels() {
    const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("API key not found in environment.");
        return;
    }
    const client = new GoogleGenAI({ apiKey });
    try {
        const response = await client.models.list();
        console.log("Listing models...");

        // In @google/genai, the response object usually has a method or is an async iterator
        // Let's try to see if it has a 'models' property hidden somewhere or if we can iterate via for-of

        // Log the actual structure if possible
        // console.log(response);

        // Let's try to iterate
        let count = 0;
        for await (const model of response) {
            console.log(`- ${model.name}`);
            count++;
            if (count > 50) break;
        }
    } catch (err) {
        console.error("Error listing models:", err);
    }
}

listModels();
