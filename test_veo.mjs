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
    } catch (e) { console.error(e); }
}

const ai = new GoogleGenAI({ apiKey });
const base64Image = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

async function testStructure(name, payload) {
    console.log(`\n--- Testing: ${name} ---`);
    try {
        const response = await ai.models.generateVideos({
            model: "veo-3.1-generate-preview",
            ...payload
        });
        console.log("SUCCESS! Name:", response.name);
    } catch (e) {
        console.log("Error:", e.message);
        if (e.status) console.log("Status:", e.status);
    }
}

async function run() {
    // 4. Double Wrapper
    await testStructure("Double Wrapper { image: { image: ... } }", {
        prompt: "A moving white pixel",
        image: {
            image: {
                bytesBase64Encoded: base64Image,
                mimeType: "image/png"
            }
        }
    });

    // 5. Input Wrapper
    await testStructure("Input Wrapper { contents: ... }", {
        contents: [
            {
                role: "user",
                parts: [
                    { text: "A moving white pixel" },
                    {
                        inlineData: {
                            mimeType: "image/png",
                            data: base64Image
                        }
                    }
                ]
            }
        ]
    });

    // 6. Direct Prompt Media?
    await testStructure("Prompt Media List", {
        prompt: [
            { text: "A moving white pixel" },
            {
                inlineData: {
                    mimeType: "image/png",
                    data: base64Image
                }
            }
        ]
    });
}

run();
