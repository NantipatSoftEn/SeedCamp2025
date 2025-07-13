import { type NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function POST(request: NextRequest) {
  try {
    console.log("🤖 Starting Gemini analysis...")

    const formData = await request.formData()
    const file = formData.get("file") as File
    const personId = formData.get("personId") as string

    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 })
    }

    if (!personId) {
      return NextResponse.json({ success: false, error: "No person ID provided" }, { status: 400 })
    }

    console.log("📄 Analyzing file:", file.name, "for person:", personId)

    // Convert file to base64
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString("base64")

    // Initialize Gemini model
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" })

    const prompt = `
    Analyze this payment slip image and extract the following information:
    1. Total amount/price (look for numbers that represent money, currency symbols like ฿, $, etc.)
    2. Item name or description (what was purchased)
    
    Please respond in JSON format with:
    {
      "amount": <number only, no currency symbols>,
      "itemName": "<item or service name>",
      "currency": "<currency symbol found>",
      "confidence": <0-1 confidence score>
    }
    
    If you cannot find clear amount information, set amount to 0.
    If you cannot find item name, set itemName to "Unknown item".
    `

    const imagePart = {
      inlineData: {
        data: base64,
        mimeType: file.type,
      },
    }

    console.log("🔍 Sending to Gemini for analysis...")
    const result = await model.generateContent([prompt, imagePart])
    const response = await result.response
    const text = response.text()

    console.log("🤖 Gemini raw response:", text)

    // Try to parse JSON response
    let analysisResult
    try {
      // Clean the response text to extract JSON
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0])
      } else {
        throw new Error("No JSON found in response")
      }
    } catch (parseError) {
      console.warn("⚠️ Could not parse Gemini response as JSON:", parseError)
      // Fallback: try to extract amount using regex
      const amountMatch = text.match(/(\d+(?:\.\d{2})?)/g)
      const amount = amountMatch ? Number.parseFloat(amountMatch[amountMatch.length - 1]) : 0

      analysisResult = {
        amount: amount,
        itemName: "Payment slip",
        currency: "฿",
        confidence: 0.5,
      }
    }

    console.log("✅ Analysis result:", analysisResult)

    return NextResponse.json({
      success: true,
      extractedAmount: analysisResult.amount || 0,
      itemName: analysisResult.itemName || "Unknown item",
      currency: analysisResult.currency || "฿",
      confidence: analysisResult.confidence || 0.5,
      originalText: text,
    })
  } catch (error) {
    console.error("❌ Error in Gemini analysis:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Analysis failed",
      },
      { status: 500 },
    )
  }
}
