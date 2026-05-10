-- This migration targeted a transient `DB_Source` column that is no longer part
-- of the canonical schema history.
-- Kept as a no-op to preserve migration ordering/history.
SELECT 1;
