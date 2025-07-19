"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Eye, Edit3, Check, X } from "lucide-react";

interface AnalysisData {
  fileName: string;
  amount: number;
  itemName: string;
  currency: string;
  confidence: number;
  name: string;
  originalText?: string;
}

interface DataReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (editedData: AnalysisData[]) => void;
  analysisResults: AnalysisData[];
  images: { file: File; preview: string }[];
}

export function DataReviewModal({
  isOpen,
  onClose,
  onConfirm,
  analysisResults,
  images,
}: DataReviewModalProps) {
  const [editedResults, setEditedResults] = useState<AnalysisData[]>(analysisResults);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  const handleFieldChange = (index: number, field: keyof AnalysisData, value: string | number) => {
    setEditedResults(prev => 
      prev.map((item, i) => 
        i === index 
          ? { ...item, [field]: field === 'amount' ? Number(value) : value }
          : item
      )
    );
  };

  const handleConfirm = () => {
    onConfirm(editedResults);
    onClose();
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "bg-green-100 text-green-800";
    if (confidence >= 0.5) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  const totalAmount = editedResults.reduce((sum, item) => sum + item.amount, 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="h-5 w-5" />
            Review & Edit AI Analysis Results
          </DialogTitle>
          <DialogDescription>
            The AI has analyzed {analysisResults.length} image(s). Please review and edit the extracted data before saving to the database.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Image Preview Section */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Images Preview</h3>
            <div className="grid grid-cols-2 gap-2">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`relative border-2 rounded-lg overflow-hidden transition-all ${
                    selectedImageIndex === index 
                      ? "border-blue-500 ring-2 ring-blue-200" 
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <img
                    src={image.preview}
                    alt={`Payment slip ${index + 1}`}
                    className="w-full h-32 object-cover"
                  />
                  <div className="absolute top-2 left-2">
                    <Badge variant="secondary" className="text-xs">
                      {index + 1}
                    </Badge>
                  </div>
                  {selectedImageIndex === index && (
                    <div className="absolute inset-0 bg-blue-500 bg-opacity-10 flex items-center justify-center">
                      <Eye className="h-6 w-6 text-blue-600" />
                    </div>
                  )}
                </button>
              ))}
            </div>
            
            {selectedImageIndex !== null && (
              <div className="border rounded-lg p-4">
                <img
                  src={images[selectedImageIndex].preview}
                  alt={`Payment slip ${selectedImageIndex + 1}`}
                  className="w-full max-h-96 object-contain rounded"
                />
                <p className="text-sm text-gray-500 mt-2">
                  {images[selectedImageIndex].file.name}
                </p>
              </div>
            )}
          </div>

          {/* Data Review Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Extracted Data</h3>
              <Badge variant="outline" className="text-lg px-3 py-1">
                Total: ฿{totalAmount.toFixed(2)}
              </Badge>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {editedResults.map((result, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="outline">#{index + 1}</Badge>
                    <Badge className={getConfidenceColor(result.confidence)}>
                      {Math.round(result.confidence * 100)}% confidence
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor={`amount-${index}`}>Amount</Label>
                      <div className="flex gap-2">
                        <Select
                          value={result.currency}
                          onValueChange={(value) => handleFieldChange(index, 'currency', value)}
                        >
                          <SelectTrigger className="w-16">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="฿">฿</SelectItem>
                            <SelectItem value="$">$</SelectItem>
                            <SelectItem value="€">€</SelectItem>
                            <SelectItem value="¥">¥</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          id={`amount-${index}`}
                          type="number"
                          step="0.01"
                          value={result.amount}
                          onChange={(e) => handleFieldChange(index, 'amount', parseFloat(e.target.value) || 0)}
                          className="flex-1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor={`name-${index}`}>Person Name</Label>
                      <Input
                        id={`name-${index}`}
                        value={result.name}
                        onChange={(e) => handleFieldChange(index, 'name', e.target.value)}
                        placeholder="First Last"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor={`item-${index}`}>Item/Description</Label>
                    <Input
                      id={`item-${index}`}
                      value={result.itemName}
                      onChange={(e) => handleFieldChange(index, 'itemName', e.target.value)}
                      placeholder="What was purchased or paid for"
                    />
                  </div>

                  {result.originalText && (
                    <div>
                      <Label htmlFor={`original-${index}`}>AI Raw Analysis</Label>
                      <Textarea
                        id={`original-${index}`}
                        value={result.originalText}
                        readOnly
                        className="text-xs bg-gray-50"
                        rows={2}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <div className="flex items-center text-sm text-gray-500">
            <span>Total files: {editedResults.length} | Total amount: ฿{totalAmount.toFixed(2)}</span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleConfirm}>
              <Check className="h-4 w-4 mr-2" />
              Confirm & Upload
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
