-- Add table_number and payment_status to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS table_number text,
ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending';

-- Update existing orders to have payment_status
UPDATE orders SET payment_status = 'pending' WHERE payment_status IS NULL;
