import { 
  validateFile, 
  generateUniqueFileName, 
  type FileProcessingResult, 
  type AnalysisResult,
  type AnalysisResultWithFileName 
} from "./file-utils";
import { uploadFileToStorage } from "./storage-utils";
import { verifyPersonExists, insertPaymentSlipRecord } from "./database-utils";
import { analyzePaymentSlipWithGemini } from "./ai-utils";

/**
 * Processes a single file: validates, uploads, and analyzes
 */
export async function processSingleFile(
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
