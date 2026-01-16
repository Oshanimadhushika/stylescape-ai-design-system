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
        const response = await ai.models.generateImages({
            model: modelName,
            prompt: "A simple red circle",
            config: { numberOfImages: 1 }
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
            console.log(`✅ ${modelName} SUCCEEDED.`);
            return true;
        } else {
            console.log(`⚠️ ${modelName} Returned No Images.`);
            return false;
        }
    } catch (e) {
        console.log(`❌ ${modelName} FAILED: ${e.message}`);
        return false;
    }
}

async function run() {
    const models = [
        "imagen-4.0-fast-generate-001",
        "imagen-4.0-generate-preview-06-06",
        "imagen-4.0-ultra-generate-preview-06-06",
        "imagen-4.0-ultra-generate-001",
        "imagen-3.0-generate-001",
        "gemini-2.0-flash-exp" // Just in case it supports generateImages natively (unlikely)
    ];

    for (const m of models) {
        await testModel(m);
    }
}

run();
