-- Add AI analysis columns to payment_slips table if they don't exist
DO $$ 
BEGIN
    -- Add extracted_amount column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'payment_slips' AND column_name = 'extracted_amount') THEN
        ALTER TABLE payment_slips ADD COLUMN extracted_amount DECIMAL(10,2);
        RAISE NOTICE 'Added extracted_amount column to payment_slips table';
    END IF;
    
    -- Add analysis_text column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'payment_slips' AND column_name = 'analysis_text') THEN
        ALTER TABLE payment_slips ADD COLUMN analysis_text TEXT;
        RAISE NOTICE 'Added analysis_text column to payment_slips table';
    END IF;
    
    -- Add item_name column for storing extracted item names
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'payment_slips' AND column_name = 'item_name') THEN
        ALTER TABLE payment_slips ADD COLUMN item_name VARCHAR(255);
        RAISE NOTICE 'Added item_name column to payment_slips table';
    END IF;
    
    -- Add confidence_score column for AI analysis confidence
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'payment_slips' AND column_name = 'confidence_score') THEN
        ALTER TABLE payment_slips ADD COLUMN confidence_score DECIMAL(3,2);
        RAISE NOTICE 'Added confidence_score column to payment_slips table';
    END IF;
    
    -- Add currency column for storing detected currency
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'payment_slips' AND column_name = 'currency') THEN
        ALTER TABLE payment_slips ADD COLUMN currency VARCHAR(10) DEFAULT '฿';
        RAISE NOTICE 'Added currency column to payment_slips table';
    END IF;
END $$;

-- Add comments to the new columns
COMMENT ON COLUMN payment_slips.extracted_amount IS 'Amount extracted by AI analysis from the payment slip image';
COMMENT ON COLUMN payment_slips.analysis_text IS 'Raw text analysis result from AI';
COMMENT ON COLUMN payment_slips.item_name IS 'Item or service name extracted by AI';
COMMENT ON COLUMN payment_slips.confidence_score IS 'AI analysis confidence score (0.0 to 1.0)';
COMMENT ON COLUMN payment_slips.currency IS 'Currency symbol detected in the payment slip';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_payment_slips_extracted_amount ON payment_slips(extracted_amount);
CREATE INDEX IF NOT EXISTS idx_payment_slips_person_amount ON payment_slips(person_id, extracted_amount);
