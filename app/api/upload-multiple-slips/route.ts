import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { GoogleGenerativeAI } from "@google/generative-ai"

// Initialize Supabase client
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

interface AnalysisResult {
  amount: number
  itemName: string
  currency: string
  confidence: number
}

async function analyzePaymentSlipWithGemini(file: File): Promise<AnalysisResult> {
  try {
    console.log("🤖 Analyzing slip with Gemini:", file.name)

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

    const result = await model.generateContent([prompt, imagePart])
    const response = await result.response
    const text = response.text()

    console.log(`🤖 Gemini response for ${file.name}:`, text)

    // Try to parse JSON response
    let analysisResult: AnalysisResult
    try {
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

    return analysisResult
  } catch (error) {
    console.error("❌ Error analyzing slip with Gemini:", error)
    return {
      amount: 0,
      itemName: "Analysis failed",
      currency: "฿",
      confidence: 0,
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("📤 Starting multiple payment slips upload...")

    const formData = await request.formData()
    const files = formData.getAll("files") as File[]
    const personId = formData.get("personId") as string
    const userId = formData.get("userId") as string
    const analyzeWithAI = formData.get("analyzeWithAI") === "true"

    if (!files || files.length === 0) {
      return NextResponse.json({ success: false, error: "No files provided" }, { status: 400 })
    }

    if (!personId) {
      return NextResponse.json({ success: false, error: "No person ID provided" }, { status: 400 })
    }

    if (!userId) {
      return NextResponse.json({ success: false, error: "No user ID provided" }, { status: 400 })
    }

    console.log(`📁 Processing ${files.length} files for person ${personId}`)

    // Verify person exists
    const { data: personCheck, error: personError } = await supabase
      .from("seedcamp_people")
      .select("id, payment_amount")
      .eq("id", personId)
      .single()

    if (personError || !personCheck) {
      return NextResponse.json({ success: false, error: `Person with ID ${personId} not found` }, { status: 404 })
    }

    const results = []
    const analysisResults: Array<{
      fileName: string
      amount: number
      itemName: string
      currency: string
      confidence: number
    }> = []

    let totalExtractedAmount = 0

    // Process each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      console.log(`📄 Processing file ${i + 1}/${files.length}: ${file.name}`)

      try {
        // Validate file
        if (!file.type.startsWith("image/")) {
          console.warn(`⚠️ Skipping non-image file: ${file.name}`)
          continue
        }

        if (file.size > 10 * 1024 * 1024) {
          console.warn(`⚠️ Skipping large file: ${file.name} (${file.size} bytes)`)
          continue
        }

        // Generate unique filename
        const fileExtension = file.name.split(".").pop()?.toLowerCase() || "jpg"
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
        const fileName = `${personId}_${timestamp}_${i}.${fileExtension}`
        const filePath = `public/seedcamp2025/${fileName}`

        // Upload to Supabase Storage
        console.log(`☁️ Uploading ${file.name} to storage...`)
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("payment-slips")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
          })

        if (uploadError) {
          console.error(`❌ Upload failed for ${file.name}:`, uploadError)
          continue
        }

        // Get public URL
        const { data: urlData } = supabase.storage.from("payment-slips").getPublicUrl(filePath)

        // Analyze with Gemini AI if enabled
        let analysisResult: AnalysisResult | null = null
        if (analyzeWithAI) {
          analysisResult = await analyzePaymentSlipWithGemini(file)
          totalExtractedAmount += analysisResult.amount

          analysisResults.push({
            fileName: file.name,
            amount: analysisResult.amount,
            itemName: analysisResult.itemName,
            currency: analysisResult.currency,
            confidence: analysisResult.confidence,
          })
        }

        // Insert into payment_slips table
        const insertData = {
          user_id: userId,
          person_id: personId,
          path: filePath,
          original_name: file.name,
          file_size: file.size,
          mime_type: file.type,
          uploaded_at: new Date().toISOString(),
          extracted_amount: analysisResult?.amount || null,
          analysis_text: analysisResult?.itemName || null,
        }

        console.log(`💾 Inserting payment slip record for ${file.name}...`)
        const { data: insertResult, error: insertError } = await supabase
          .from("payment_slips")
          .insert(insertData)
          .select()
          .single()

        if (insertError) {
          console.error(`❌ Database insert failed for ${file.name}:`, insertError)
          // Clean up uploaded file
          await supabase.storage.from("payment-slips").remove([filePath])
          continue
        }

        results.push({
          id: insertResult.id,
          fileName: file.name,
          path: filePath,
          url: urlData.publicUrl,
          extractedAmount: analysisResult?.amount || 0,
          itemName: analysisResult?.itemName || null,
          success: true,
        })

        console.log(`✅ Successfully processed ${file.name}`)
      } catch (error) {
        console.error(`❌ Error processing ${file.name}:`, error)
        results.push({
          fileName: file.name,
          error: error instanceof Error ? error.message : "Unknown error",
          success: false,
        })
      }
    }

    // Update person's payment amount and status
    if (totalExtractedAmount > 0) {
      const currentAmount = personCheck.payment_amount || 0
      const newAmount = currentAmount + totalExtractedAmount

      console.log(`💰 Updating person payment amount: ${currentAmount} + ${totalExtractedAmount} = ${newAmount}`)

      const { error: updateError } = await supabase
        .from("seedcamp_people")
        .update({
          payment_amount: newAmount,
          payment_status: "paid",
          updated_at: new Date().toISOString(),
        })
        .eq("id", personId)

      if (updateError) {
        console.error("❌ Failed to update person payment amount:", updateError)
      } else {
        console.log("✅ Person payment amount updated successfully")
      }
    }

    // Console log analysis results
    if (analysisResults.length > 0) {
      console.log("\n🤖 === GEMINI ANALYSIS RESULTS ===")
      analysisResults.forEach((result, index) => {
        console.log(`📄 Slip ${index + 1}: ${result.fileName}`)
        console.log(`   💰 Amount: ${result.currency}${result.amount}`)
        console.log(`   🏷️  Item: ${result.itemName}`)
        console.log(`   🎯 Confidence: ${(result.confidence * 100).toFixed(1)}%`)
        console.log("   ---")
      })
      console.log(`💵 Total extracted amount: ฿${totalExtractedAmount}`)
      console.log("=================================\n")
    }

    const successCount = results.filter((r) => r.success).length
    const failCount = results.filter((r) => !r.success).length

    return NextResponse.json({
      success: true,
      message: `Processed ${files.length} files: ${successCount} successful, ${failCount} failed`,
      results,
      analysisResults,
      totalExtractedAmount,
      summary: {
        totalFiles: files.length,
        successful: successCount,
        failed: failCount,
        totalAmount: totalExtractedAmount,
      },
    })
  } catch (error) {
    console.error("❌ Error in multiple upload:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Upload failed",
      },
      { status: 500 },
    )
  }
}
