import { GoogleGenAI } from "@google/genai";

console.log("Initializing GoogleGenAI...");
const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY });

async function listModels() {
    try {
        console.log("Fetching model list...");
        const response = await ai.models.list();

        console.log("\n--- Available Models ---");
        if (response.models) {
            response.models.forEach(model => {
                console.log(`\nName: ${model.name}`);
                console.log(`Display Name: ${model.displayName}`);
                console.log(`Supported Generation Methods: ${model.supportedGenerationMethods?.join(", ")}`);
            });
        } else {
            console.log("No models found in response.");
        }

    } catch (error) {
        console.error("Error listing models:", error);
    }
}

listModels();
