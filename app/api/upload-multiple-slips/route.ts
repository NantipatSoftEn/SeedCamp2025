import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

interface AnalysisResult {
  name: string;
  amount: number;
  itemName: string;
  currency: string;
  confidence: number;
}

interface FileProcessingResult {
  fileName: string;
  success: boolean;
  error?: string;
  id?: string;
  path?: string;
  url?: string;
  extractedAmount?: number;
  itemName?: string;
}

interface AnalysisResultWithFileName extends AnalysisResult {
  fileName: string;
}

/**
 * Validates if a file is suitable for processing
 */
function validateFile(file: File): { isValid: boolean; error?: string } {
  if (!file.type.startsWith("image/")) {
    return { isValid: false, error: "File is not an image" };
  }

  if (file.size > 10 * 1024 * 1024) {
    return { isValid: false, error: "File size too large (max 10MB)" };
  }

  return { isValid: true };
}

/**
 * Generates a unique filename for the uploaded file
 */
function generateUniqueFileName(personId: string, originalName: string, index: number): string {
  const fileExtension = originalName.split(".").pop()?.toLowerCase() || "jpg";
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `${personId}_${timestamp}_${index}.${fileExtension}`;
}

/**
 * Uploads a file to Supabase storage
 */
async function uploadFileToStorage(file: File, filePath: string): Promise<{ success: boolean; publicUrl?: string; error?: string }> {
  try {
    console.log(`☁️ Uploading ${file.name} to storage...`);
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("payment-slips")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error(`❌ Upload failed for ${file.name}:`, uploadError);
      return { success: false, error: uploadError.message };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("payment-slips")
      .getPublicUrl(filePath);

    return { success: true, publicUrl: urlData.publicUrl };
  } catch (error) {
    console.error(`❌ Error uploading ${file.name}:`, error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown upload error" };
  }
}

/**
 * Verifies if a person exists in the database
 */
async function verifyPersonExists(firstName: string): Promise<{ exists: boolean; data?: {id:string,first_name:string}; error?: string }> {
  try {
    const { data: personCheck, error: personError } = await supabase
      .from("seedcamp_people")
      .select("id, first_name")
      .like("first_name", `%${firstName}%` )
      .single();

    if (personError || !personCheck) {
      return { exists: false, error: `Person with name ${firstName} not found` };
    }

    return { exists: true, data: personCheck };
  } catch (error) {
    return { exists: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

/**
 * Logs analysis results to console
 */
function logAnalysisResults(analysisResults: AnalysisResultWithFileName[], totalExtractedAmount: number): void {
  if (analysisResults.length === 0) return;

  console.log("\n🤖 === GEMINI ANALYSIS RESULTS ===");
  analysisResults.forEach((result, index) => {
    console.log(`📄 Slip ${index + 1}: ${result.fileName}`);
    console.log(`   💰 Amount: ${result.currency}${result.amount}`);
    console.log(`   🏷️  Item: ${result.itemName}`);
    console.log(`   🎯 Confidence: ${(result.confidence * 100).toFixed(1)}%`);
    console.log(`   👤 Name: ${result.name}`);
    console.log("   ---");
  });
  console.log(`💵 Total extracted amount: ฿${totalExtractedAmount}`);
  console.log("=================================\n");
}

/**
 * Updates person's payment amount and status (currently commented out)
 */
async function updatePersonPaymentAmount(
  personId: string, 
  currentAmount: number, 
  additionalAmount: number
): Promise<{ success: boolean; error?: string }> {
  const newAmount = currentAmount + additionalAmount;
  
  console.log(`💰 Updating person payment amount: ${currentAmount} + ${additionalAmount} = ${newAmount}`);

  const { error: updateError } = await supabase
    .from("seedcamp_people")
    .update({
      payment_amount: newAmount,
      payment_status: "paid",
      updated_at: new Date().toISOString(),
    })
    .eq("id", personId);

  if (updateError) {
    console.error("❌ Failed to update person payment amount:", updateError);
    return { success: false, error: updateError.message };
  } else {
    console.log("✅ Person payment amount updated successfully");
    return { success: true };
  }
}

/**
 * Inserts payment slip record into database
 */
async function insertPaymentSlipRecord(
  person_id: string,
  filePath: string,
  file: File,
  analysisResult: AnalysisResult | null
): Promise<{ success: boolean; data?: any; error?: string }> {
  const insertData = {
    person_id,
    path: filePath,
    original_name: file.name,
    file_size: file.size,
    mime_type: file.type,
    uploaded_at: new Date().toISOString(),
    extracted_amount: analysisResult?.amount || null,
    // analysis_text: analysisResult?.itemName || null,
  };

  console.log(`💾 Inserting payment slip record for ${file.name}...`);
  
  const { data: insertResult, error: insertError } = await supabase
    .from("payment_slips")
    .insert(insertData)
    .select()
    .single();

  if (insertError) {
    console.error(`❌ Database insert failed for ${file.name}:`, insertError);
    return { success: false, error: insertError.message };
  }

  console.log(`✅ Database record created for ${file.name}:`, insertResult);
  return { success: true, data: insertResult };
}

/**
 * Processes a single file: validates, uploads, and analyzes
 */
async function processSingleFile(
  file: File, 
  personId: string, 
  index: number
): Promise<{ 
  result: FileProcessingResult; 
  analysis: AnalysisResultWithFileName | null;
  filePath?: string;
}> {
  console.log(`📄 Processing file ${index + 1}: ${file.name}`);

  // Validate file
  const validation = validateFile(file);
  if (!validation.isValid) {
    console.warn(`⚠️ Skipping file ${file.name}: ${validation.error}`);
    return {
      result: {
        fileName: file.name,
        success: false,
        error: validation.error,
      },
      analysis: null,
    };
  }

  try {
    // Generate unique filename and path
    const fileName = generateUniqueFileName(personId, file.name, index);
    const filePath = `public/seedcamp2025/${fileName}`;

    // Upload to storage
    const uploadResult = await uploadFileToStorage(file, filePath);
    if (!uploadResult.success) {
      return {
        result: {
          fileName: file.name,
          success: false,
          error: uploadResult.error,
        },
        analysis: null,
      };
    }

    // Analyze with Gemini AI
    const analysisResult = await analyzePaymentSlipWithGemini(file);
    console.log(`🤖 Analysis result for ${file.name}:`, analysisResult);

    const analysis: AnalysisResultWithFileName = {
      ...analysisResult,
      fileName: file.name,
    };

    console.log(`✅ Successfully processed ${file.name}`);
    
    return {
      result: {
        fileName: file.name,
        success: true,
        path: filePath,
        url: uploadResult.publicUrl,
        extractedAmount: analysisResult?.amount || 0,
        itemName: analysisResult?.itemName || undefined,
      },
      analysis,
      filePath,
    };
  } catch (error) {
    console.error(`❌ Error processing ${file.name}:`, error);
    return {
      result: {
        fileName: file.name,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      analysis: null,
    };
  }
}

async function analyzePaymentSlipWithGemini(
  file: File
): Promise<AnalysisResult> {
  try {
    console.log("🤖 Analyzing slip with Gemini:", file.name);

    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString("base64");

    // Initialize Gemini model
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    const prompt = `
    Analyze this payment slip image and extract the following information:
    1. Total amount/price (look for numbers that represent money, currency symbols like ฿, $, etc.)
    2. Item name or description (what was purchased)
    3. Get first name of the person who made  payment to accont not a reviced
    
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

    // console.log(`🤖 Gemini response for ${file.name}:`, text);

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

export async function POST(request: NextRequest) {
  try {
    // console.log("📤 Starting multiple payment slips upload...");

    // Parse form data
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const personId = formData.get("personId") as string;

    // Validate input
    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, error: "No files provided" },
        { status: 400 }
      );
    }

    if (!personId) {
      return NextResponse.json(
        { success: false, error: "No person ID provided" },
        { status: 400 }
      );
    }

    // console.log(`📁 Processing ${files.length} files for person ${personId}`);



    // Process all files
    const results: FileProcessingResult[] = [];
    const analysisResults: AnalysisResultWithFileName[] = [];
    let totalExtractedAmount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const { result, analysis, filePath } = await processSingleFile(file, personId, i);
      
      results.push(result);
      
      if (analysis) {
        analysisResults.push(analysis);
        totalExtractedAmount += analysis.amount;
      }

      // Always attempt to insert database record after successful upload
      if (result.success && filePath) {
        let targetPersonId = personId; // Default to provided personId
        
        // If we have analysis with a name, try to find the person
        if (analysis?.name) {
          const firstName = analysis.name.split(' ')[0];
          const { exists, data, error } = await verifyPersonExists(firstName);
          console.log(`👤 Person verification result for ${firstName}:`, { exists, data, error });
          
          if (exists && data?.id) {
            targetPersonId = data.id;
            console.log(`✅ Using verified person ID: ${targetPersonId} for ${firstName}`);
          } else {
            console.warn(`⚠️ Person with name ${firstName} does not exist, using provided personId: ${personId}`);
          }
        }
        
        // Insert payment slip record with the determined person ID
        const insertResult = await insertPaymentSlipRecord(targetPersonId, filePath, file, analysis);
        if (insertResult.success) {
          console.log(`✅ Database record inserted for ${file.name}`);
        } else {
          console.error(`❌ Failed to insert database record for ${file.name}:`, insertResult.error);
        }
      }
    }

    // Log analysis results
    logAnalysisResults(analysisResults, totalExtractedAmount);

    // Update person's payment amount and status (commented out for now)
    // if (totalExtractedAmount > 0) {
    //   await updatePersonPaymentAmount(personId, personVerification.data.payment_amount, totalExtractedAmount);
    // }

    // Calculate summary
    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    // TODO: Replace with actual first/last name lookup if available
    const firstName = "First";
    const lastName = "Last";

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
      name: `${firstName} ${lastName}`,
    });
  } catch (error) {
    console.error("❌ Error in multiple upload:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Upload failed",
      },
      { status: 500 }
    );
  }
}
