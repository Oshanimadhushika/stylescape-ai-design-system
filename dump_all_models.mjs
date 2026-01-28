import { GoogleGenAI } from "@google/genai";
import fs from 'fs';
import path from 'path';

async function dumpModels() {
    const envPath = path.resolve('.env');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/^(?:GOOGLE_API_KEY|GEMINI_API_KEY)=(.*)$/m);
    const apiKey = match ? match[1].trim() : null;

    if (!apiKey) {
        console.error("No API key found");
        return;
    }

    const genAI = new GoogleGenAI(apiKey);
    try {
        // Correct way to list models in latest SDK
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();

        if (data.models) {
            console.log("AVAILABLE MODELS:");
            data.models.forEach(m => {
                console.log(`- ${m.name}`);
            });
        } else {
            console.log("No models found or error in response:", JSON.stringify(data));
        }
    } catch (error) {
        console.error("Error:", error.message);
    }
}

dumpModels();
