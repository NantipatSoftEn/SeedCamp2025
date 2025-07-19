import { GoogleGenerativeAI } from "@google/generative-ai";
import type { AnalysisResult } from "./file-utils";

// Initialize Gemini AI
const getGeminiClient = () => {
  return new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
};

/**
 * Analyzes a payment slip using Gemini AI
 */
export async function analyzePaymentSlipWithGemini(
  file: File
): Promise<AnalysisResult> {
  try {
    console.log("🤖 Analyzing slip with Gemini:", file.name);

    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString("base64");

    // Initialize Gemini model
    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    const prompt = `
    Analyze this payment slip image and extract the following information:
    1. Total amount/price (look for numbers that represent money, currency symbols like ฿, $, etc.)
    2. Item name or description (what was purchased)
    3. Get first name of the person who made  payment to account not a received
    Please respond in JSON format with:
    {
      "name": "<first name> <last name>",
      "amount": <number only, no currency symbols>,
      "itemName": "<item or service name>",
      "currency": "<currency symbol found>",
      "confidence": <0-1 confidence score>
    }
    
    If you cannot find clear amount information, set amount to 0.
    If you cannot find item name, set itemName to "Unknown item".
    `;

    const imagePart = {
      inlineData: {
        data: base64,
        mimeType: file.type,
      },
    };

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();

    // Try to parse JSON response
    let analysisResult: AnalysisResult;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.warn("⚠️ Could not parse Gemini response as JSON:", parseError);
      // Fallback: try to extract amount using regex
      const amountMatch = text.match(/(\d+(?:\.\d{2})?)/g);
      const amount = amountMatch
        ? Number.parseFloat(amountMatch[amountMatch.length - 1])
        : 0;

      analysisResult = {
        amount: amount,
        itemName: "Payment slip",
        currency: "฿",
        confidence: 0.5,
        name: "Unknown",
      };
    }

    return analysisResult;
  } catch (error) {
    console.error("❌ Error analyzing slip with Gemini:", error);
    return {
      amount: 0,
      itemName: "Analysis failed",
      currency: "฿",
      confidence: 0,
      name: "Unknown",
    };
  }
}
