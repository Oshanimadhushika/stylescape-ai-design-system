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
const fileUri = "https://generativelanguage.googleapis.com/v1beta/files/eqfrrs754j41"; // From previous run

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
    // 1. Source Param
    await testStructure("Source { image: { uri } }", {
        prompt: "A moving white pixel",
        source: {
            image: {
                uri: fileUri,
                mimeType: "image/png"
            }
        }
    });

    // 2. Image URI key
    await testStructure("Flat image_uri", {
        prompt: "A moving white pixel",
        image_uri: fileUri
    });

    // 3. gcsUri (fake but checks key existence)
    await testStructure("image { gcsUri }", {
        prompt: "A moving white pixel",
        image: {
            gcsUri: fileUri, // try passing http uri as gcsUri just in case
            mimeType: "image/png"
        }
    });

    // 4. image { fileUri }
    await testStructure("image { fileUri }", {
        prompt: "A moving white pixel",
        image: {
            fileUri: fileUri,
            mimeType: "image/png"
        }
    });
}

run();
