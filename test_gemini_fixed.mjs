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
    console.log("Testing generateContent(gemini-2.0-flash)...");
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: [{ role: "user", parts: [{ text: "Say hello" }] }]
        });

        // Handle different possible response structures
        let text = "";
        if (response.text && typeof response.text === "function") {
            text = response.text();
        } else if (response.candidates && response.candidates[0].content.parts[0].text) {
            text = response.candidates[0].content.parts[0].text;
        }

        console.log("Response:", text);
        console.log("✅ Success! generateContent is working.");
    } catch (e) {
        console.log("❌ FAILED:");
        console.log("Message:", e.message);
        if (e.status) console.log("Status:", e.status);
    }
}

run();
