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

async function testModel(modelName) {
    console.log(`Testing ${modelName}...`);
    try {
        const response = await ai.models.generateContent({
            model: modelName,
            contents: [{ role: "user", parts: [{ text: "Hello" }] }]
        });
        console.log(`✅ ${modelName} SUCCEEDED.`);
        return true;
    } catch (e) {
        console.log(`❌ ${modelName} FAILED: ${e.message}`);
        return false;
    }
}

async function run() {
    const models = [
        "gemini-1.5-flash",
        "gemini-1.5-flash-001",
        "gemini-1.5-flash-8b",
        "gemini-2.0-flash-exp",
        "gemini-1.5-pro",
        "gemini-1.5-pro-001"
    ];

    for (const m of models) {
        await testModel(m);
    }
}

run();
