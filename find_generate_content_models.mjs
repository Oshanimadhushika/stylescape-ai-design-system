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
    console.log("Searching for models with generateContent...");
    try {
        const response = await ai.models.list();
        if (response && response.models) {
            response.models.forEach(m => {
                if (m.supportedActions?.includes("generateContent")) {
                    console.log(`- ${m.name} (${m.displayName})`);
                }
            });
        }
    } catch (error) {
        console.error("Error:", error.message);
    }
}

run();
