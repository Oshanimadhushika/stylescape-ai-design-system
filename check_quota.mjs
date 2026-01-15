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
    console.log("--- Checking Generic API Quota (Gemini 1.5 Flash) ---");
    try {
        const response = await ai.models.generateContent({
            model: "gemini-1.5-flash-001",
            contents: [{ role: "user", parts: [{ text: "Hello, are you alive?" }] }]
        });
        console.log("Flash Response:", response.text ? response.text().substring(0, 50) + "..." : "Success (No text)");
        console.log("✅ Generic API Quota OK.");
    } catch (e) {
        console.log("❌ Flash Failed:", e.message);
        if (e.status) console.log("Status:", e.status);
    }

    console.log("\n--- Checking Veo Availability/Quota (Dry Run) ---");
    try {
        // Just checking if we can even list the model, effectively.
        // Actually, let's try to generate a tiny video if possible, or just catch the 429 immediately.
        // We won't actually wait for the LRO, just start it.
        const fileUri = "https://generativelanguage.googleapis.com/v1beta/files/eqfrrs754j41";

        console.log("Attempting Veo generation start...");
        const veoResp = await ai.models.generateVideos({
            model: "veo-3.1-generate-preview",
            image_uri: fileUri,
            prompt: "Test pixel",
        });
        console.log("✅ Veo Start Success. Name:", veoResp.name);
    } catch (e) {
        console.log("❌ Veo Failed:", e.message);
        if (e.status) console.log("Status:", e.status);
    }
}

run();
