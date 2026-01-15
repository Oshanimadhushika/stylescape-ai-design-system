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
const fileUri = "https://generativelanguage.googleapis.com/v1beta/files/eqfrrs754j41"; // From previous valid upload

async function run() {
    console.log("Testing generateVideos WITH config...");
    
    try {
        const payload = {
            model: "veo-3.1-generate-preview",
            prompt: "A moving white pixel",
            image_uri: fileUri,
            config: {
                aspectRatio: "16:9",
                resolution: "720p",
            }
        };
        
        console.log("Payload:", JSON.stringify(payload, null, 2));

        const response = await ai.models.generateVideos(payload);
        
        console.log("SUCCESS! Name:", response.name);
    } catch (e) {
        console.log("Error:", e.message);
        console.log("Stack:", e.stack);
        if (e.status) console.log("Status:", e.status);
    }
}

run();
