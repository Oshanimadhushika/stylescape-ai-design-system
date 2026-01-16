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
    console.log("Testing gemini-2.0-flash-exp response structure...");
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash-exp",
            contents: [{ role: "user", parts: [{ text: "Hello" }] }]
        });

        console.log("Response Keys:", Object.keys(response));
        console.log("Full Response:", JSON.stringify(response, null, 2));

        // specific checks
        if (typeof response.text === 'function') console.log("response.text() exists");
        else console.log("response.text() DOES NOT exist");

    } catch (e) {
        console.log("Error:", e.message);
    }
}

run();
