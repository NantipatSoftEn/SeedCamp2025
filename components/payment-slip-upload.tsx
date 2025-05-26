"use client"

import type React from "react"
import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Box, Button, Typography, CircularProgress, Alert } from "@mui/material"
import CloudUploadIcon from "@mui/icons-material/CloudUpload"

interface PaymentSlipUploadProps {
  onUpload: (file: File) => void
  loading: boolean
  error: string | null
  clearError: () => void
}

const PaymentSlipUpload: React.FC<PaymentSlipUploadProps> = ({ onUpload, loading, error, clearError }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0]
      setSelectedFile(file)
      clearError() // Clear any previous errors when a new file is selected
    },
    [clearError],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".png", ".jpg", ".gif", ".bmp"],
      "application/pdf": [".pdf"],
    },
    maxFiles: 1,
  })

  const handleUpload = () => {
    if (selectedFile) {
      onUpload(selectedFile)
    }
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: 3,
        border: "2px dashed grey",
        borderRadius: 1,
        backgroundColor: "#fafafa",
        color: "#bdbdbd",
        cursor: "pointer",
        "&:hover": {
          borderColor: "primary.main",
          color: "primary.main",
        },
      }}
    >
      <Box
        {...getRootProps()}
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "100%",
        }}
      >
        <input {...getInputProps()} />
        <CloudUploadIcon sx={{ fontSize: 60 }} />
        <Typography variant="body1">
          {isDragActive ? "Drop the file here ..." : "Drag and drop or click to select a payment slip"}
        </Typography>
        <Typography variant="caption">(Accepts .jpeg, .png, .jpg, .gif, .bmp, .pdf)</Typography>
      </Box>

      {selectedFile && (
        <Box mt={2} textAlign="center">
          <Typography variant="subtitle2">Selected File: {selectedFile.name}</Typography>
        </Box>
      )}

      {error && (
        <Alert severity="error" onClose={clearError} sx={{ mt: 2, width: "100%" }}>
          {error}
        </Alert>
      )}

      <Button
        variant="contained"
        color="primary"
        onClick={handleUpload}
        disabled={!selectedFile || loading}
        sx={{ mt: 3 }}
      >
        {loading ? <CircularProgress size={24} color="inherit" /> : "Upload Payment Slip"}
      </Button>
    </Box>
  )
}

export default PaymentSlipUpload
