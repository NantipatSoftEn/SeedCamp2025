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
  success: boolean
}

const PaymentSlipUpload: React.FC<PaymentSlipUploadProps> = ({ onUpload, loading, error, success }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    setSelectedFile(file)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, multiple: false })

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
        cursor: "pointer",
        "&:hover": {
          backgroundColor: "#f0f0f0",
        },
      }}
      {...getRootProps()}
    >
      <input {...getInputProps()} />
      <CloudUploadIcon sx={{ fontSize: 40, color: "grey", mb: 1 }} />
      <Typography variant="body1" color="textSecondary">
        {isDragActive ? "Drop the payment slip here ..." : `Drag 'n' drop a payment slip here, or click to select file`}
      </Typography>
      {selectedFile && (
        <Typography variant="subtitle2" color="textSecondary" mt={1}>
          Selected file: {selectedFile.name}
        </Typography>
      )}

      <Button
        variant="contained"
        color="primary"
        onClick={handleUpload}
        disabled={!selectedFile || loading}
        sx={{ mt: 2 }}
      >
        {loading ? <CircularProgress size={24} color="inherit" /> : "Upload"}
      </Button>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mt: 2 }}>
          Payment slip uploaded successfully!
        </Alert>
      )}
    </Box>
  )
}

export default PaymentSlipUpload
