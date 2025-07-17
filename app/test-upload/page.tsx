"use client";

import { useState } from "react";

export default function TestUploadPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [personId, setPersonId] = useState<string>("");
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!files.length) {
      alert("Please select at least one file");
      return;
    }

    if (!personId) {
      alert("Please enter a person ID");
      return;
    }

    setLoading(true);
    setResponse(null);

    try {
      const formData = new FormData();
      files.forEach((file, idx) => {
        formData.append("files", file);
      });
      formData.append("personId", personId);
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
      <h1 className="text-3xl font-bold mb-6">Test File Upload API</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="personId" className="block text-sm font-medium mb-2">
            Person ID:
          </label>
          <input
            type="text"
            id="personId"
            value={personId}
            onChange={(e) => setPersonId(e.target.value)}
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
          <strong>URL:</strong> /api/analyze-payment-slip
          <br />
          <strong>Method:</strong> POST
          <br />
          <strong>Content-Type:</strong> multipart/form-data
          <br />
          <strong>Body:</strong> FormData with 'files' (multiple) and 'personId' fields
        </p>
      </div>
    </div>
  );
}
