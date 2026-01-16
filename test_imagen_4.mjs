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
    console.log("Testing Imagen 4 via GoogleGenAI SDK...");
    try {
        // Trying Imagen 4.0
        const response = await ai.models.generateImages({
            model: "imagen-4.0-generate-001",
            prompt: "A beautiful landscape of futuristic turkey, photorealistic, 8k",
            config: {
                numberOfImages: 1,
            }
        });

        console.log("Response received!");
        if (response.generatedImages && response.generatedImages.length > 0) {
            console.log("Image generated successfully.");
            console.log("Image content present (base64 length):", response.generatedImages[0].image.imageBytes.length);
        } else {
            console.log("No images in response", response);
        }
    } catch (error) {
        console.error("Error generating image:", error.message);
        if (error.status) console.error("Status:", error.status);
    }
}

run();
