import fs from 'fs';
import path from 'path';

// Read .env file manually
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
        console.error("Error reading .env:", e);
    }
}

if (!apiKey) {
    console.error("No API key found in env!");
    process.exit(1);
}

console.log("Checking available models via REST API...");

async function checkModels() {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);

        if (!response.ok) {
            console.error(`HTTP Error: ${response.status} ${response.statusText}`);
            const text = await response.text();
            console.error("Response:", text);
            return;
        }

        const data = await response.json();

        console.log("\n--- Video Models Found ---");
        const videoModels = data.models?.filter(m =>
            m.name.includes("veo") ||
            m.supportedGenerationMethods?.includes("generateVideo") ||
            m.supportedGenerationMethods?.includes("predictLongRunning")
        );

        if (videoModels && videoModels.length > 0) {
            videoModels.forEach(m => {
                console.log(`\nName: ${m.name}`);
                console.log(`Methods: ${m.supportedGenerationMethods?.join(", ")}`);
            });
        } else {
            console.log("NO video models found in your account.");
        }

        console.log("\n--- All Models (Names) ---");
        data.models?.forEach(m => console.log(m.name));

    } catch (error) {
        console.error("Fetch error:", error);
    }
}

checkModels();
