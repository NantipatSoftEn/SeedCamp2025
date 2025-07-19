import { type NextRequest, NextResponse } from "next/server";
import {
  logAnalysisResults,
  type AnalysisResultWithFileName,
  type FileProcessingResult,
} from "@/utils/file-utils";
import {
  verifyPersonExists,
  insertPaymentSlipRecord,
} from "@/utils/database-utils";
import { processSingleFile } from "@/utils/file-processing";
// import { updatePersonPaymentAmount } from "@/utils/payment-utils"; // Uncomment when needed

export async function POST(request: NextRequest) {
  try {
    // console.log("📤 Starting multiple payment slips upload...");

    // Parse form data
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const authId = formData.get("authId") as string;

    // Validate input
    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, error: "No files provided" },
        { status: 400 }
      );
    }

    // if (!personId) {
    //   return NextResponse.json(
    //     { success: false, error: "No person ID provided" },
    //     { status: 400 }
    //   );
    // }

    // console.log(`📁 Processing ${files.length} files for person ${personId}`);

    // Process all files
    const results: FileProcessingResult[] = [];
    const analysisResults: AnalysisResultWithFileName[] = [];
    let totalExtractedAmount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const { result, analysis, filePath } = await processSingleFile(
        file,
        authId,
        i
      );

      results.push(result);

      if (analysis) {
        analysisResults.push(analysis);
        totalExtractedAmount += analysis.amount;
      }

      // Always attempt to insert database record after successful upload
      if (result.success && filePath) {
        let userId = ""; // Default to provided personId

        // If we have analysis with a name, try to find the person
        if (analysis?.name) {
          const firstName = analysis.name.split(" ")[0];
          const { exists, data, error } = await verifyPersonExists(firstName);
          console.log(`👤 Person verification result for ${firstName}:`, {
            exists,
            data,
            error,
          });

          if (exists && data?.id) {
            userId = data.id;
            console.log(`✅ Using verified : ${data.id} for ${firstName}`);
          } else {
            console.warn(
              `⚠️ Person with name ${firstName} does not exist, using provided personId: ${authId}`
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
