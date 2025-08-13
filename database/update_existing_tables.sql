-- Safe migration script for existing tables
-- Run this separately if you get errors about existing columns

-- Check and add user_id column to activity_logs if it exists
DROP PROCEDURE IF EXISTS AddColumnIfNotExists;

DELIMITER $$
CREATE PROCEDURE AddColumnIfNotExists()
BEGIN
    DECLARE table_count INT DEFAULT 0;
    DECLARE column_count INT DEFAULT 0;
    
    -- Check if activity_logs table exists
    SELECT COUNT(*) INTO table_count 
    FROM information_schema.tables 
    WHERE table_schema = 'ai_stock_management' AND table_name = 'activity_logs';
    
    IF table_count > 0 THEN
        -- Check if user_id column exists
        SELECT COUNT(*) INTO column_count 
        FROM information_schema.columns 
        WHERE table_schema = 'ai_stock_management' 
        AND table_name = 'activity_logs' 
        AND column_name = 'user_id';
        
        IF column_count = 0 THEN
            ALTER TABLE activity_logs ADD COLUMN user_id INT AFTER id;
            ALTER TABLE activity_logs ADD INDEX idx_user_id (user_id);
            SELECT 'Column user_id added successfully' as result;
        ELSE
            SELECT 'Column user_id already exists' as result;
        END IF;
    ELSE
        SELECT 'Table activity_logs does not exist' as result;
    END IF;
END$$
DELIMITER ;

-- Execute the procedure
CALL AddColumnIfNotExists();

-- Clean up
DROP PROCEDURE AddColumnIfNotExists;
