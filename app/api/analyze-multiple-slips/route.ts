import { type NextRequest, NextResponse } from "next/server";
import { analyzePaymentSlipWithGemini } from "@/utils/ai-utils";
import { validateFile } from "@/utils/file-utils";
import type { AnalysisResult } from "@/utils/file-utils";

interface AnalysisResultWithFileName extends AnalysisResult {
  fileName: string;
}

export async function POST(request: NextRequest) {
  try {
    console.log("🔍 Starting AI analysis for multiple payment slips...");

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

    console.log(`🤖 Analyzing ${files.length} files...`);

    // Analyze all files with AI without uploading
    const analysisResults: AnalysisResultWithFileName[] = [];
    let totalExtractedAmount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      console.log(`📄 Analyzing file ${i + 1}: ${file.name}`);

      // Validate file
      const validation = validateFile(file);
      if (!validation.isValid) {
        console.warn(`⚠️ Skipping file ${file.name}: ${validation.error}`);
        analysisResults.push({
          fileName: file.name,
          amount: 0,
          itemName: "Invalid file",
          currency: "฿",
          confidence: 0,
          name: "Unknown",
        });
        continue;
      }

      try {
        // Analyze with Gemini AI
        const analysisResult = await analyzePaymentSlipWithGemini(file);
        console.log(`🤖 Analysis result for ${file.name}:`, analysisResult);

        const analysis: AnalysisResultWithFileName = {
          ...analysisResult,
          fileName: file.name,
        };

        analysisResults.push(analysis);
        totalExtractedAmount += analysisResult.amount;
      } catch (error) {
        console.error(`❌ Error analyzing ${file.name}:`, error);
        analysisResults.push({
          fileName: file.name,
          amount: 0,
          itemName: "Analysis failed",
          currency: "฿",
          confidence: 0,
          name: "Unknown",
        });
      }
    }

    console.log("✅ AI analysis completed:", {
      totalFiles: files.length,
      totalAmount: totalExtractedAmount,
      results: analysisResults.length,
    });

    return NextResponse.json({
      success: true,
      message: `Analyzed ${files.length} files. Total amount: ฿${totalExtractedAmount.toFixed(2)}`,
      analysisResults,
      totalExtractedAmount,
      summary: {
        totalFiles: files.length,
        totalAmount: totalExtractedAmount,
        avgConfidence: analysisResults.length > 0 
          ? analysisResults.reduce((sum, r) => sum + r.confidence, 0) / analysisResults.length 
          : 0,
      },
    });
  } catch (error) {
    console.error("❌ Error in AI analysis:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Analysis failed",
      },
      { status: 500 }
    );
  }
}
