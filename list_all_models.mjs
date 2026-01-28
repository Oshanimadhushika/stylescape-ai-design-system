import { GoogleGenAI } from "@google/genai";
import fs from 'fs';
import path from 'path';

async function listAllModels() {
    const envPath = path.resolve('.env');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/^(?:GOOGLE_API_KEY|GEMINI_API_KEY)=(.*)$/m);
    const apiKey = match ? match[1].trim() : null;

    if (!apiKey) {
        console.error("No API key found");
        return;
    }

    const ai = new GoogleGenAI({ apiKey });
    try {
        const response = await ai.models.list();
        console.log("TOTAL MODELS:", response.models?.length);
        response.models?.forEach(m => {
            console.log(`${m.name} | ${m.supportedActions?.join(", ")}`);
        });
    } catch (error) {
        console.error("Error:", error.message);
    }
}

listAllModels();
