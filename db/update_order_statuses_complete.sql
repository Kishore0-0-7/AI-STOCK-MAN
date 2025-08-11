-- Update customer order statuses to be more practical and real-time
USE ai_stock_management;

-- First, map existing statuses to new practical ones
UPDATE customer_orders SET status = 'preparing' WHERE status = 'processing';
UPDATE customer_orders SET status = 'ready' WHERE status = 'shipped';
UPDATE customer_orders SET status = 'completed' WHERE status = 'delivered';
-- Keep 'pending', 'confirmed', and 'cancelled' as they are already practical

-- Check current statuses after update
SELECT DISTINCT status FROM customer_orders;

-- Now update the enum to only include practical statuses
-- We need to add the new values first, then remove old ones
ALTER TABLE customer_orders 
MODIFY COLUMN status ENUM(
    'pending',      -- Order placed, waiting for confirmation
    'confirmed',    -- Order confirmed, payment received  
    'preparing',    -- Order being prepared/packed
    'ready',        -- Order ready for pickup/dispatch
    'completed',    -- Order completed successfully
    'cancelled'     -- Order cancelled
) DEFAULT 'pending';

-- Update payment status if needed
-- Check current payment statuses first
SELECT DISTINCT payment_status FROM customer_orders;

-- Update payment status enum to be more practical only if 'refunded' exists
UPDATE customer_orders SET payment_status = 'partial' WHERE payment_status = 'refunded';

-- Then modify the payment status enum
ALTER TABLE customer_orders 
MODIFY COLUMN payment_status ENUM(
    'pending',      -- Payment not yet received
    'paid',         -- Payment completed
    'failed',       -- Payment failed
    'partial'       -- Partial payment received
) DEFAULT 'pending';

SELECT 'Customer order statuses updated successfully!' as result;
SELECT DISTINCT status as 'Final Order Statuses' FROM customer_orders;
SELECT DISTINCT payment_status as 'Final Payment Statuses' FROM customer_orders;
