-- Update customer order statuses to be more practical and real-time
USE ai_stock_management;

-- First, update existing records to use new status values
UPDATE customer_orders SET status = 'preparing' WHERE status = 'processing';
UPDATE customer_orders SET status = 'ready' WHERE status = 'shipped';
UPDATE customer_orders SET status = 'completed' WHERE status = 'delivered';
-- Keep 'pending', 'confirmed', and 'cancelled' as they are practical

-- Now update the enum to only include practical statuses
ALTER TABLE customer_orders 
MODIFY COLUMN status ENUM(
    'pending',      -- Order placed, waiting for confirmation
    'confirmed',    -- Order confirmed, payment received  
    'preparing',    -- Order being prepared/packed
    'ready',        -- Order ready for pickup/dispatch
    'completed',    -- Order completed successfully
    'cancelled'     -- Order cancelled
) DEFAULT 'pending';

-- Update payment status enum to be more practical
-- First update existing 'refunded' to 'partial'
UPDATE customer_orders SET payment_status = 'partial' WHERE payment_status = 'refunded';

-- Then modify the enum
ALTER TABLE customer_orders 
MODIFY COLUMN payment_status ENUM(
    'pending',      -- Payment not yet received
    'paid',         -- Payment completed
    'failed',       -- Payment failed
    'partial'       -- Partial payment received
) DEFAULT 'pending';

SELECT 'Customer order statuses updated successfully!' as result;
SELECT DISTINCT status as 'New Statuses' FROM customer_orders;
SELECT DISTINCT payment_status as 'New Payment Statuses' FROM customer_orders;
