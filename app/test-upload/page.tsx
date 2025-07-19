"use client";

import { useState } from "react";
import { DataReviewModal } from "@/components/data-review-modal";

export default function TestUploadPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [authId, setAuthId] = useState<string>("0fbd3ea4-fe7b-4b4c-8c62-04461e5aeed7");
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<any[]>([]);
  const [imagePreviewsData, setImagePreviewsData] = useState<{ file: File; preview: string }[]>([]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!files.length) {
      alert("Please select at least one file");
      return;
    }

    if (!authId) {
      alert("Please enter an auth ID");
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
      formData.append("authId", authId);
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
      formData.append("authId", authId);
      formData.append("editedData", JSON.stringify(editedData));
      
      const res = await fetch("/api/upload-multiple-slips", {
        method: "POST", 
        body: formData,
      });

      const data = await res.json();
      setResponse({
        status: res.status,
        statusText: res.statusText,
        data: data,
      });
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

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="personId" className="block text-sm font-medium mb-2">
            Person ID:
          </label>
          <input
            type="text"
            id="authId"
            value={authId}
            onChange={(e) => setAuthId(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter person ID (e.g., 12345)"
            required
          />
        </div>

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
          <h2 className="text-xl font-semibold mb-4">Response:</h2>
          <div className="bg-gray-100 p-4 rounded-md">
            <pre className="whitespace-pre-wrap text-sm overflow-auto">
              {JSON.stringify(response, null, 2)}
            </pre>
          </div>
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
          <strong>Body:</strong> FormData with 'files' (multiple) and 'authId' fields
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
