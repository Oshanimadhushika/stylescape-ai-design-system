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

const PROMPT = `Photorealistic, 4k, high fashion pricing: A fair-skinned woman with a slender build, wearing a light mauve dress with a deep V-neck and a fitted bodice that flows into a pleated, A-line skirt hitting mid-thigh. The dress is made of a smooth, slightly shiny material, such as satin or crepe, with subtle draping at the waist.`;

async function run() {
    console.log("Testing imagen-4.0-fast-generate-001 with complex prompt...");
    try {
        const response = await ai.models.generateImages({
            model: "imagen-4.0-fast-generate-001",
            prompt: PROMPT,
            config: {
                numberOfImages: 1,
                aspectRatio: "3:4",
                safetyFilterLevel: "BLOCK_LOW_AND_ABOVE",
                personGeneration: "ALLOW_ADULT",
            }
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
            console.log("✅ Success! Image generated.");
        } else {
            console.log("⚠️ No images returned.");
        }
    } catch (e) {
        console.log("❌ FAILED:");
        console.log("Message:", e.message);
        if (e.status) console.log("Status:", e.status);
    }
}

run();
