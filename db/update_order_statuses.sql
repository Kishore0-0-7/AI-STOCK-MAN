-- Update customer order statuses to be more practical and real-time
USE ai_stock_management;

-- Update the enum values for customer order status
ALTER TABLE customer_orders 
MODIFY COLUMN status ENUM(
    'pending',      -- Order placed, waiting for confirmation
    'confirmed',    -- Order confirmed, payment received
    'preparing',    -- Order being prepared/packed
    'ready',        -- Order ready for pickup/dispatch
    'completed',    -- Order completed successfully
    'cancelled'     -- Order cancelled
) DEFAULT 'pending';

-- Update existing orders with old statuses to new ones
UPDATE customer_orders SET status = 'preparing' WHERE status = 'processing';
UPDATE customer_orders SET status = 'completed' WHERE status = 'delivered';
UPDATE customer_orders SET status = 'cancelled' WHERE status = 'rejected';

-- Also update payment status to be more practical
ALTER TABLE customer_orders 
MODIFY COLUMN payment_status ENUM(
    'pending',      -- Payment not yet received
    'paid',         -- Payment completed
    'failed',       -- Payment failed
    'partial'       -- Partial payment received
) DEFAULT 'pending';

-- Update existing payment statuses
UPDATE customer_orders SET payment_status = 'partial' WHERE payment_status = 'refunded';

SELECT 'Customer order statuses updated successfully!' as result;
