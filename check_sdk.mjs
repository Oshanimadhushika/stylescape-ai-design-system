import { GoogleGenAI } from "@google/genai";

console.log("Initializing GoogleGenAI with dummy key...");
const ai = new GoogleGenAI({ apiKey: "test" });

if (ai.files) {
    console.log("\n--- AI.Files Keys ---");
    console.log("Own:", Object.getOwnPropertyNames(ai.files));
    console.log("Prototype:", Object.getOwnPropertyNames(Object.getPrototypeOf(ai.files)));

    // Check for upload method
    const uploadMethod = ai.files.uploadFile || ai.files.create || ai.files.upload;
    if (uploadMethod) {
        console.log("\n[SUCCESS] Found upload method:", uploadMethod.name);
    }
} else {
    console.log("\nAI.Files property is missing.");
}
