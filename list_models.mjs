import { GoogleGenAI } from "@google/genai";
import fs from 'fs';
import path from 'path';

let apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
if (!apiKey) {
    try {
        const envPath = path.resolve('.env');
        if (fs.existsSync(envPath)) {
            const envContent = fs.readFileSync(envPath, 'utf8');
            const match = envContent.match(/^(?:GOOGLE_API_KEY|GEMINI_API_KEY)=(.*)$/m);
            if (match) {
                apiKey = match[1].trim();
            }
        }
    } catch (e) {
        console.error(e);
    }
}

const ai = new GoogleGenAI({ apiKey });

async function run() {
    console.log("Listing models...");
    try {
        // The SDK might not have a clean listModels exposed directly on 'ai' or 'ai.models', let's check
        // standard is usually ai.models.list()
        const response = await ai.models.list();
        // response typically has .models containing the list
        if (response && response.models) {
            response.models.forEach(m => {
                if (m.name.includes("image") || m.name.includes("vision") || m.name.includes("veo")) {
                    console.log(m.name, m.supportedGenerationMethods);
                }
            });
        } else {
            console.log("Response structure unknown:", response);
        }
    } catch (error) {
        console.error("Error listing models:", error.message);
    }
}

run();
