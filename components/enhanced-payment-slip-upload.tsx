"use client";

import type React from "react";
import { useState, useRef, useEffect } from "react";
import { Upload, X, Eye, Loader2, Database, Edit3 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { supabaseStorage } from "@/lib/supabase-storage";
import { useDataSource } from "@/contexts/data-source-context";
import { useAuth } from "@/contexts/auth-context";
import { CustomAlert, CustomAlertDescription } from "./custom-alert";
import { SingleDataReviewModal } from "./single-data-review-modal";
import { analyzePaymentSlipWithGemini } from "@/utils/ai-utils";

interface PaymentSlipUploadProps {
  currentSlip?: string;
  onSlipChange: (slip: string | undefined) => void;
  personInfo: {
    nickname: string;
    firstName: string;
    lastName: string;
    id: string;
  };
}

export function EnhancedPaymentSlipUpload({
  currentSlip,
  onSlipChange,
  personInfo,
}: PaymentSlipUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [reviewEnabled, setReviewEnabled] = useState(true);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  
  const [paymentSlips, setPaymentSlips] = useState<
    Array<{
      id: string;
      url: string;
      path: string;
      originalName: string;
      uploadedAt: string;
    }>
  >([]);
  const [dbTestResult, setDbTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [testing, setTesting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { dataSource } = useDataSource();
  const { user } = useAuth();

  // โหลดข้อมูล payment slips เมื่อ component mount
  useEffect(() => {
    if (dataSource === "supabase") {
      loadPaymentSlips();
    }
  }, [dataSource, personInfo.id]);

  const loadPaymentSlips = async () => {
    if (dataSource === "supabase" && personInfo.id) {
      try {
        const slips = await supabaseStorage.getPersonPaymentSlips(
          personInfo.id
        );
        setPaymentSlips(slips);

        // ถ้ามี payment slip ล่าสุด ให้ใช้เป็น current slip
        if (slips.length > 0 && !currentSlip) {
          onSlipChange(slips[0].path); // ใช้ path แทน URL
        }
      } catch (error) {
        console.error("Failed to load payment slips:", error);
      }
    }
  };

  const testDatabaseConnection = async () => {
    setTesting(true);
    try {
      const result = await supabaseStorage.testDatabaseConnection();
      setDbTestResult(result);
    } catch (error) {
      setDbTestResult({
        success: false,
        message: `Test failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      });
    } finally {
      setTesting(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setUploadError("Please select an image file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError("File size must be less than 10MB");
      return;
    }

    setUploadError(null);
    setUploadSuccess(false);
    setDbTestResult(null);

    if (dataSource === "mock") {
      // Mock mode - convert to base64
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        onSlipChange(result);
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 3000);
      };
      reader.readAsDataURL(file);
      return;
    }

    // Store pending file and create preview
    setPendingFile(file);
    const preview = URL.createObjectURL(file);
    setPreviewUrl(preview);

    if (reviewEnabled) {
      // Analyze with AI first
      setAnalyzing(true);
      try {
        console.log("🤖 Analyzing payment slip with AI...");
        const analysis = await analyzePaymentSlipWithGemini(file);
        setAnalysisData(analysis);
        setShowReviewModal(true);
      } catch (error) {
        console.error("❌ AI analysis failed:", error);
        setUploadError("AI analysis failed. Proceeding with manual upload.");
        // Proceed with direct upload
        await uploadFile(file);
      } finally {
        setAnalyzing(false);
      }
    } else {
      // Direct upload without review
      await uploadFile(file);
    }
  };

  const uploadFile = async (file: File, editedData?: any) => {
    setUploading(true);
    setUploadProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Delete old file if exists
      if (
        currentSlip &&
        (currentSlip.includes("supabase") || currentSlip.includes("public/"))
      ) {
        console.log("🗑️ Deleting old file before upload...");
        await supabaseStorage.deletePaymentSlip(currentSlip, personInfo.id);
      }

      // Upload new file
      console.log("📤 Starting upload for person ID:", personInfo.id);
      
      // If we have edited data, we could potentially modify the analysis here
      const result = await supabaseStorage.uploadPaymentSlip(
        file,
        personInfo.nickname,
        personInfo.firstName,
        personInfo.lastName,
        personInfo.id
      );

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (result) {
        onSlipChange(result.path);
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 3000);
        await loadPaymentSlips();
        console.log("✅ Payment slip uploaded successfully:", result);
      } else {
        throw new Error("Upload failed - no result returned");
      }
    } catch (error) {
      console.error("❌ Upload failed:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Upload failed";

      if (
        errorMessage.includes("Authentication required") ||
        errorMessage.includes("logged in")
      ) {
        setUploadError(
          `${errorMessage}\n\nPlease make sure you are logged in and try again.`
        );
      } else if (errorMessage.includes("bucket")) {
        setUploadError(
          `${errorMessage}\n\nTip: Check your Supabase Storage setup in the database.`
        );
      } else if (
        errorMessage.includes("row-level security") ||
        errorMessage.includes("RLS")
      ) {
        setUploadError(
          `${errorMessage}\n\nTip: Check your Supabase RLS policies for payment_slips and seedcamp_people tables.`
        );
      } else if (errorMessage.includes("foreign key")) {
        setUploadError(
          `${errorMessage}\n\nTip: Person ID ${personInfo.id} may not exist in the database.`
        );
      } else {
        setUploadError(errorMessage);
      }
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleConfirmReview = (editedData: any) => {
    if (pendingFile) {
      uploadFile(pendingFile, editedData);
    }
    setShowReviewModal(false);
    setPendingFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl("");
    }
  };

  const handleCancelReview = () => {
    setShowReviewModal(false);
    setPendingFile(null);
    setAnalyzing(false);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl("");
    }
  };

  const removeSlip = async () => {
    if (dataSource === "mock") {
      onSlipChange(undefined);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setUploadError(null);
      setUploadSuccess(false);
      return;
    }

    setDeleting(true);
    setUploadError(null);

    try {
      console.log("🗑️ Deleting all payment slips for person:", personInfo.id);
      const success = await supabaseStorage.deleteAllPaymentSlipsForPerson(
        personInfo.id
      );

      if (success) {
        onSlipChange(undefined);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        await loadPaymentSlips();
        console.log("✅ All payment slips deleted successfully");
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 3000);
      } else {
        throw new Error("Failed to delete payment slips");
      }
    } catch (error) {
      console.error("❌ Delete failed:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Delete failed";
      setUploadError(`Failed to delete payment slips: ${errorMessage}`);
    } finally {
      setDeleting(false);
    }
  };

  const getDisplayUrl = (pathOrUrl?: string) => {
    if (!pathOrUrl) return "/placeholder.svg";

    if (dataSource === "mock" || pathOrUrl.startsWith("data:")) {
      return pathOrUrl;
    }

    if (pathOrUrl.startsWith("http")) {
      return pathOrUrl;
    }

    if (pathOrUrl.includes("public/")) {
      return supabaseStorage.getPublicUrl(pathOrUrl);
    }

    return pathOrUrl;
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const originalSrc = img.src;

    console.warn("❌ Image failed to load:", originalSrc);

    if (
      currentSlip &&
      !currentSlip.startsWith("http") &&
      currentSlip.includes("public/")
    ) {
      const retryUrl = supabaseStorage.getPublicUrl(currentSlip);
      console.log("🔄 Retrying with converted URL:", retryUrl);

      if (img.src !== retryUrl) {
        img.src = retryUrl;
        return;
      }
    }

    img.src = "/placeholder.svg";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Enhanced Payment Slip Upload</Label>
        <div className="flex items-center gap-4">
          {/* Review Toggle */}
          <div className="flex items-center gap-2">
            <Label htmlFor="review-toggle" className="text-sm">
              Review AI Analysis
            </Label>
            <Switch
              id="review-toggle"
              checked={reviewEnabled}
              onCheckedChange={setReviewEnabled}
            />
          </div>
          {dataSource === "supabase" && (
            <Button
              size="sm"
              variant="outline"
              onClick={testDatabaseConnection}
              disabled={testing}
            >
              {testing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Database className="h-4 w-4" />
              )}
              Test DB
            </Button>
          )}
        </div>
      </div>

      {/* Database Test Result */}
      {dbTestResult && (
        <CustomAlert variant={dbTestResult.success ? "default" : "destructive"}>
          <CustomAlertDescription>
            <strong>Database Test:</strong> {dbTestResult.message}
          </CustomAlertDescription>
        </CustomAlert>
      )}

      {/* Upload Status Messages */}
      {uploadError && (
        <CustomAlert variant="destructive">
          <CustomAlertDescription className="whitespace-pre-line">
            {uploadError}
          </CustomAlertDescription>
        </CustomAlert>
      )}

      {uploadSuccess && (
        <CustomAlert variant="success">
          <CustomAlertDescription>
            {deleting
              ? "Payment slips deleted successfully! Payment status updated to 'Unpaid'."
              : "Payment slip uploaded successfully! Payment status updated to 'Paid' and slip path saved."}
            {dataSource === "supabase" && " Database updated successfully."}
          </CustomAlertDescription>
        </CustomAlert>
      )}

      {/* AI Analysis Progress */}
      {analyzing && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Analyzing with AI...</span>
          </div>
          <p className="text-xs text-gray-500">
            Please wait while we extract payment information from your image.
          </p>
        </div>
      )}

      {/* Upload Progress */}
      {uploading && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Uploading to Supabase Storage...</span>
          </div>
          <Progress value={uploadProgress} className="h-2" />
          <p className="text-xs text-gray-500">
            Uploading for person ID: {personInfo.id} ({personInfo.nickname})
          </p>
        </div>
      )}

      {/* Delete Progress */}
      {deleting && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">
              Deleting payment slips from database and storage...
            </span>
          </div>
          <p className="text-xs text-gray-500">
            Deleting all payment slips for person ID: {personInfo.id} (
            {personInfo.nickname})
          </p>
        </div>
      )}

      {currentSlip && !uploading && !deleting && !analyzing ? (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={getDisplayUrl(currentSlip) || "/placeholder.svg"}
                  alt="Payment slip"
                  className="w-16 h-16 object-cover rounded border"
                  onError={handleImageError}
                  onLoad={() =>
                    console.log(
                      "✅ Image loaded successfully:",
                      getDisplayUrl(currentSlip)
                    )
                  }
                />
                <div>
                  <p className="text-sm font-medium">Payment slip uploaded</p>
                  <p className="text-xs text-gray-500">
                    {dataSource === "supabase"
                      ? "Stored in Supabase Storage & Database"
                      : "Mock data"}
                  </p>
                  <p className="text-xs text-gray-400">
                    Person ID: {personInfo.id} - {personInfo.nickname} (
                    {personInfo.firstName} {personInfo.lastName})
                  </p>
                  {dataSource === "supabase" && paymentSlips.length > 0 && (
                    <p className="text-xs text-blue-600">
                      📁 {paymentSlips.length} file(s) in database
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Payment Slip Preview</DialogTitle>
                      <DialogDescription>
                        Payment slip for {personInfo.nickname} (
                        {personInfo.firstName} {personInfo.lastName})
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-center">
                      <img
                        src={getDisplayUrl(currentSlip) || "/placeholder.svg"}
                        alt="Payment slip"
                        className="max-w-full max-h-96 object-contain border rounded"
                        onError={handleImageError}
                        onLoad={() =>
                          console.log("✅ Preview image loaded successfully")
                        }
                      />
                    </div>
                    <div className="text-xs text-gray-400 mt-2">
                      <div>
                        <strong>Source:</strong> {currentSlip}
                      </div>
                      <div>
                        <strong>Display URL:</strong>{" "}
                        {getDisplayUrl(currentSlip)}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={removeSlip}
                  disabled={uploading || deleting}
                >
                  {deleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <X className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : !uploading && !deleting && !analyzing ? (
        <div
          className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragActive
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 hover:border-gray-400"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={uploading || deleting || analyzing}
          />
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-600">
            <span className="font-medium">Click to upload</span> or drag and
            drop
          </p>
          <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
          {reviewEnabled && (
            <p className="text-xs text-blue-600 mt-2 flex items-center justify-center gap-1">
              <Edit3 className="h-3 w-3" />
              AI analysis & review enabled
            </p>
          )}
          <p className="text-xs text-blue-600 mt-1">
            {dataSource === "supabase"
              ? `Will save path to payment_slip field for person_id: ${personInfo.id}`
              : "Using mock data mode"}
          </p>
        </div>
      ) : null}

      {dataSource === "supabase" && !user && (
        <CustomAlert variant="destructive" className="mt-2">
          <CustomAlertDescription>
            You must be logged in to upload payment slips to Supabase Storage.
          </CustomAlertDescription>
        </CustomAlert>
      )}

      {/* Payment Slips History (for Supabase mode) */}
      {dataSource === "supabase" && paymentSlips.length > 1 && (
        <Card>
          <CardContent className="p-4">
            <h4 className="text-sm font-medium mb-2">Payment Slip History</h4>
            <div className="space-y-2">
              {paymentSlips.slice(1).map((slip) => (
                <div
                  key={slip.id}
                  className="flex items-center gap-2 text-xs text-gray-500"
                >
                  <img
                    src={slip.url || "/placeholder.svg"}
                    alt="Previous slip"
                    className="w-8 h-8 object-cover rounded border"
                    onError={(e) => {
                      e.currentTarget.src = "/placeholder.svg";
                    }}
                  />
                  <span>{slip.originalName}</span>
                  <span>
                    ({new Date(slip.uploadedAt).toLocaleDateString()})
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Review Modal */}
      {analysisData && (
        <SingleDataReviewModal
          isOpen={showReviewModal}
          onClose={handleCancelReview}
          onConfirm={handleConfirmReview}
          analysisResult={analysisData}
          imageUrl={previewUrl}
          fileName={pendingFile?.name || ""}
        />
      )}
    </div>
  );
}
