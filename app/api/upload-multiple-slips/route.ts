import { type NextRequest, NextResponse } from "next/server";
import {
  logAnalysisResults,
  type AnalysisResultWithFileName,
  type FileProcessingResult,
} from "@/utils/file-utils";
import {
  verifyPersonExists,
  insertPaymentSlipRecord,
} from "@/lib/supabase";
import { processSingleFile } from "@/utils/file-processing";
// import { updatePersonPaymentAmount } from "@/utils/payment-utils"; // Uncomment when needed

export async function POST(request: NextRequest) {
  try {
    console.log("📤 Starting multiple payment slips upload...");

    // Parse form data
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const authId = formData.get("authId") as string;
    const editedDataString = formData.get("editedData") as string;

    // Parse edited data if provided
    let editedData: any[] = [];
    if (editedDataString) {
      try {
        editedData = JSON.parse(editedDataString);
        console.log("✏️ Using edited data:", editedData.length, "items");
      } catch (error) {
        console.error("❌ Error parsing edited data:", error);
      }
    }

    // Validate input
    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, error: "No files provided" },
        { status: 400 }
      );
    }

    console.log(`📁 Processing ${files.length} files for auth ID ${authId}`);

    // Process all files
    const results: FileProcessingResult[] = [];
    const analysisResults: AnalysisResultWithFileName[] = [];
    let totalExtractedAmount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Use edited data if available, otherwise process normally
      let analysis: AnalysisResultWithFileName | null = null;
      
      if (editedData.length > i) {
        // Use edited data
        analysis = {
          ...editedData[i],
          fileName: file.name,
        };
        console.log(`✏️ Using edited data for ${file.name}:`, analysis);
      } else {
        // Process file normally
        const { result, analysis: processedAnalysis } = await processSingleFile(
          file,
          authId,
          i
        );
        
        results.push(result);
        analysis = processedAnalysis;
      }

      if (analysis) {
        analysisResults.push(analysis);
        totalExtractedAmount += analysis.amount;
        
        // Upload file to storage and create database record
        const { result: uploadResult, filePath } = await processSingleFile(
          file,
          authId,
          i
        );
        
        results.push(uploadResult);

        // Always attempt to insert database record after successful upload
        if (uploadResult.success && filePath) {
          let userId = authId; // Default to provided authId

          // If we have analysis with a name, try to find the person
          if (analysis?.name && analysis.name !== "Unknown") {
            const firstName = analysis.name.split(" ")[0];
            const { exists, data, error } = await verifyPersonExists(firstName);
            console.log(`👤 Person verification result for ${firstName}:`, {
              exists,
              data,
              error,
            });

            if (exists && data?.id) {
              userId = data.id;
              console.log(`✅ Using verified person ID: ${data.id} for ${firstName}`);
            } else {
              console.warn(
                `⚠️ Person with name ${firstName} does not exist, using provided authId: ${authId}`
              );
            }
          }

          // Insert payment slip record with the determined person ID
          const insertResult = await insertPaymentSlipRecord(
            authId,
            filePath,
            file,
            userId,
            analysis
          );
          
          if (insertResult.success) {
            console.log(`✅ Database record inserted for ${file.name}`);
          } else {
            console.error(
              `❌ Failed to insert database record for ${file.name}:`,
              insertResult.error
            );
          }
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
