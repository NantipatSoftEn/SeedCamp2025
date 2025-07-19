"use client";

import { useState } from "react";
import { DataReviewModal } from "@/components/data-review-modal";

export default function TestUploadPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [authId, setAuthId] = useState<string>("0fbd3ea4-fe7b-4b4c-8c62-04461e5aeed7");
  const [personId, setPersonId] = useState<string>("");
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<any[]>([]);
  const [imagePreviewsData, setImagePreviewsData] = useState<{ file: File; preview: string }[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(selectedFiles);
      
      // Create image previews
      const previews = selectedFiles.map(file => {
        const preview = URL.createObjectURL(file);
        return { file, preview };
      });
      setImagePreviewsData(previews);
    }
  };

  const validatePaymentSlipImages = async (files: File[]): Promise<string[]> => {
    const errors: string[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Check if file is an image
      if (!file.type.startsWith('image/')) {
        errors.push(`${file.name}: Only image files are allowed for payment slips`);
        continue;
      }
      
      // Basic validation - check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        errors.push(`${file.name}: File size too large (max 10MB)`);
      }
      
      // You could add more sophisticated AI-based validation here
      // For now, we'll assume images are payment slips and let the AI analysis handle it
    }
    
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors([]);

    if (!files.length) {
      alert("Please select at least one file");
      return;
    }

    if (!authId.trim()) {
      alert("Please enter an auth ID");
      return;
    }

    // Validate payment slip images
    const imageErrors = await validatePaymentSlipImages(files);
    if (imageErrors.length > 0) {
      setValidationErrors(imageErrors);
      return;
    }

    setLoading(true);
    setResponse(null);

    try {
      // First, do initial analysis without saving to database
      const formData = new FormData();
      files.forEach((file) => {
        formData.append("files", file);
      });
      formData.append("firstName", authId.trim());
      formData.append("reviewMode", "true"); // Add review mode flag
      
      const res = await fetch("/api/analyze-multiple-slips", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      
      if (data.success && data.analysisResults) {
        // Show review modal with analysis results
        setAnalysisResults(data.analysisResults);
        setShowReviewModal(true);
        setLoading(false);
        
        // Store person ID if returned from verification
        if (data.personId) {
          setPersonId(data.personId);
        }
      } else {
        setResponse({
          status: res.status,
          statusText: res.statusText,
          data: data,
        });
        setLoading(false);
      }
    } catch (error) {
      setResponse({
        error: error instanceof Error ? error.message : "Unknown error",
      });
      setLoading(false);
    }
  };

  const handleConfirmUpload = async (editedData: any[]) => {
    setLoading(true);
    setShowReviewModal(false);

    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append("files", file);
      });
      formData.append("firstName", authId.trim());
      formData.append("editedData", JSON.stringify(editedData));
      
      const res = await fetch("/api/upload-multiple-slips", {
        method: "POST", 
        body: formData,
      });

      const data = await res.json();
      const responseData = {
        status: res.status,
        statusText: res.statusText,
        data: data,
      };
      
      setResponse(responseData);
      
      // Store person ID if returned from upload response
      if (data.success && data.personId) {
        setPersonId(data.personId);
      }
      
      // If successful, clear the form after a delay to show success message
      if (data.success) {
        setUploadSuccess(true);
        setTimeout(() => {
          // Clear form state for next upload
          setFiles([]);
          setImagePreviewsData([]);
          setAnalysisResults([]);
          setUploadSuccess(false);
          // Reset file input
          const fileInput = document.getElementById('files') as HTMLInputElement;
          if (fileInput) fileInput.value = '';
        }, 5000); // Show success for 5 seconds
      }
    } catch (error) {
      setResponse({
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6"> File Upload API</h1>

      {/* Success Status Banner */}
      {uploadSuccess && (
        <div className="mb-6 bg-green-100 border-l-4 border-green-500 p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-4">
              <h2 className="text-xl font-bold text-green-800">🎉 Upload Successful!</h2>
              <p className="text-green-700 mt-1">Your payment slips have been successfully uploaded and processed.</p>
              {response?.data?.summary && (
                <div className="mt-2 text-sm text-green-600">
                  <p>✅ {response.data.summary.successful} files uploaded successfully</p>
                  <p>💰 Total amount: ${response.data.summary.totalAmount?.toFixed(2) || '0.00'}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="authId" className="block text-sm font-medium mb-2">
            Auth ID:
          </label>
          <input
            type="text"
            id="authId"
            value={authId}
            onChange={(e) => setAuthId(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter auth ID (e.g., พิมพ์พิสุทธิ์)"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Enter the auth ID to find the person's seedcamp ID
          </p>
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
            <div className="flex items-center mb-2">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Validation Errors</h3>
              </div>
            </div>
            <div className="text-sm text-red-700">
              <ul className="list-disc list-inside space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <div>
          <label htmlFor="files" className="block text-sm font-medium mb-2">
            Select Files:
          </label>
          <input
            type="file"
            id="files"
            multiple
            onChange={handleFileChange}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            accept="image/*,application/pdf,.txt,.doc,.docx"
            required
          />
          {files.length > 0 && (
            <ul className="mt-2 text-sm text-gray-600">
              {files.map((file, idx) => (
                <li key={idx}>
                  {file.name} ({(file.size / 1024).toFixed(2)} KB)
                </li>
              ))}
            </ul>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? "Uploading..." : "Upload Files"}
        </button>
      </form>

      {response && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Upload Result:</h2>
          
          {/* Success Status */}
          {response.data?.success && (
            <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-md mb-4">
              <div className="flex items-center mb-2">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">Upload Successful!</h3>
                </div>
              </div>
              
              <div className="text-sm text-green-700 mb-3">
                <p className="font-medium">{response.data.message}</p>
                {response.data.summary && (
                  <div className="mt-2 space-y-1">
                    <p>• Total files: {response.data.summary.totalFiles}</p>
                    <p>• Successful uploads: {response.data.summary.successful}</p>
                    {response.data.summary.failed > 0 && (
                      <p className="text-red-600">• Failed uploads: {response.data.summary.failed}</p>
                    )}
                    <p>• Total amount extracted: ${response.data.summary.totalAmount?.toFixed(2) || '0.00'}</p>
                  </div>
                )}
              </div>

              {/* Link to person page */}
              <div className="mt-3">
                <a 
                  href={`/person/${personId || 'unknown'}`}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                >
                  View Person Details →
                </a>
              </div>
            </div>
          )}

          {/* Error Status */}
          {(response.error || (response.data && !response.data.success)) && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md mb-4">
              <div className="flex items-center mb-2">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Upload Failed</h3>
                </div>
              </div>
              
              <div className="text-sm text-red-700">
                <p className="font-medium">
                  {response.error || response.data?.error || 'An unknown error occurred during upload'}
                </p>
                {response.data?.message && (
                  <p className="mt-1">{response.data.message}</p>
                )}
              </div>
            </div>
          )}

          {/* Technical Details (Collapsible) */}
          <details className="mt-4">
            <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
              Show technical details
            </summary>
            <div className="mt-2 bg-gray-100 p-4 rounded-md">
              <pre className="whitespace-pre-wrap text-sm overflow-auto">
                {JSON.stringify(response, null, 2)}
              </pre>
            </div>
          </details>
        </div>
      )}

      <div className="mt-8 p-4 bg-yellow-50 rounded-md">
        <h3 className="font-semibold text-yellow-800 mb-2">
          API Endpoint Info:
        </h3>
        <p className="text-sm text-yellow-700">
          <strong>URL:</strong> /api/analyze-multiple-slips → /api/upload-multiple-slips
          <br />
          <strong>Method:</strong> POST
          <br />
          <strong>Content-Type:</strong> multipart/form-data
          <br />
          <strong>Flow:</strong> AI Analysis → Review & Edit → Upload to Database
          <br />
          <strong>Body:</strong> FormData with 'files' (multiple) and 'firstName' fields
          <br />
          <strong>Validation:</strong> Images are validated as payment slips before processing
        </p>
      </div>

      {analysisResults && (
        <DataReviewModal
          isOpen={showReviewModal}
          onClose={() => {
            setShowReviewModal(false);
            setLoading(false);
          }}
          onConfirm={handleConfirmUpload}
          analysisResults={analysisResults}
          images={imagePreviewsData}
        />
      )}

      {/* Data Review Modal */}
      {/* <DataReviewModal
        isOpen={showReviewModal}
        onClose={() => {
          setShowReviewModal(false);
          setLoading(false);
        }}
        onConfirm={handleConfirmUpload}
        analysisResults={analysisResults}
        images={imagePreviewsData}
      /> */}
    </div>
  );
}
