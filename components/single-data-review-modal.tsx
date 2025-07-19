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
import { Edit3, Check, X } from "lucide-react";

interface SingleAnalysisData {
  amount: number;
  itemName: string;
  currency: string;
  confidence: number;
  name: string;
  originalText?: string;
}

interface SingleDataReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (editedData: SingleAnalysisData) => void;
  analysisResult: SingleAnalysisData;
  imageUrl: string;
  fileName: string;
}

export function SingleDataReviewModal({
  isOpen,
  onClose,
  onConfirm,
  analysisResult,
  imageUrl,
  fileName,
}: SingleDataReviewModalProps) {
  const [editedResult, setEditedResult] = useState<SingleAnalysisData>(analysisResult);

  const handleFieldChange = (field: keyof SingleAnalysisData, value: string | number) => {
    setEditedResult(prev => ({
      ...prev,
      [field]: field === 'amount' ? Number(value) : value
    }));
  };

  const handleConfirm = () => {
    onConfirm(editedResult);
    onClose();
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "bg-green-100 text-green-800";
    if (confidence >= 0.5) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="h-5 w-5" />
            Review & Edit AI Analysis
          </DialogTitle>
          <DialogDescription>
            The AI has analyzed your payment slip. Please review and edit the extracted data before saving.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Image Preview Section */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Payment Slip Preview</h3>
            <div className="border rounded-lg overflow-hidden">
              <img
                src={imageUrl}
                alt="Payment slip"
                className="w-full max-h-96 object-contain"
              />
            </div>
            <p className="text-sm text-gray-500">{fileName}</p>
          </div>

          {/* Data Review Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="font-semibold text-lg">Extracted Data</h3>
              <Badge className={getConfidenceColor(editedResult.confidence)}>
                {Math.round(editedResult.confidence * 100)}% confidence
              </Badge>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="amount">Amount</Label>
                  <div className="flex gap-2">
                    <Select
                      value={editedResult.currency}
                      onValueChange={(value) => handleFieldChange('currency', value)}
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
                      id="amount"
                      type="number"
                      step="0.01"
                      value={editedResult.amount}
                      onChange={(e) => handleFieldChange('amount', parseFloat(e.target.value) || 0)}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="name">Person Name</Label>
                  <Input
                    id="name"
                    value={editedResult.name}
                    onChange={(e) => handleFieldChange('name', e.target.value)}
                    placeholder="First Last"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="item">Item/Description</Label>
                <Input
                  id="item"
                  value={editedResult.itemName}
                  onChange={(e) => handleFieldChange('itemName', e.target.value)}
                  placeholder="What was purchased or paid for"
                />
              </div>

              {editedResult.originalText && (
                <div>
                  <Label htmlFor="original">AI Raw Analysis</Label>
                  <Textarea
                    id="original"
                    value={editedResult.originalText}
                    readOnly
                    className="text-xs bg-gray-50"
                    rows={4}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <div className="flex items-center text-sm text-gray-500">
            <span>Amount: {editedResult.currency}{editedResult.amount.toFixed(2)}</span>
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
