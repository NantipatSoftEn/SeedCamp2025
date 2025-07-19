/**
 * File validation and manipulation utilities
 */

/**
 * Validates if a file is suitable for processing
 */
export function validateFile(file: File): { isValid: boolean; error?: string } {
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
export function generateUniqueFileName(personId: string, originalName: string, index: number): string {
  const fileExtension = originalName.split(".").pop()?.toLowerCase() || "jpg";
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `${personId}_${timestamp}_${index}.${fileExtension}`;
}

/**
 * Logs analysis results to console
 */
export function logAnalysisResults(analysisResults: AnalysisResultWithFileName[], totalExtractedAmount: number): void {
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

// Re-export types for convenience
export interface AnalysisResult {
  name: string;
  amount: number;
  itemName: string;
  currency: string;
  confidence: number;
}

export interface FileProcessingResult {
  fileName: string;
  success: boolean;
  error?: string;
  id?: string;
  path?: string;
  url?: string;
  extractedAmount?: number;
  itemName?: string;
}

export interface AnalysisResultWithFileName extends AnalysisResult {
  fileName: string;
}
