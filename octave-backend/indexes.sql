
CREATE INDEX IF NOT EXISTS "idx_rent_payments_storeId" ON "rent_payments"("storeId");
CREATE INDEX IF NOT EXISTS "idx_rent_payments_landlordId" ON "rent_payments"("landlordId");
CREATE INDEX IF NOT EXISTS "idx_rent_payments_status" ON "rent_payments"("status");
CREATE INDEX IF NOT EXISTS "idx_rent_payments_dueDate" ON "rent_payments"("dueDate");


CREATE INDEX IF NOT EXISTS "idx_utility_bills_storeId" ON "utility_bills"("storeId");
CREATE INDEX IF NOT EXISTS "idx_utility_bills_status" ON "utility_bills"("status");
CREATE INDEX IF NOT EXISTS "idx_utility_bills_dueDate" ON "utility_bills"("dueDate");


CREATE INDEX IF NOT EXISTS "idx_petty_cash_requests_storeId" ON "petty_cash_requests"("storeId");
CREATE INDEX IF NOT EXISTS "idx_petty_cash_requests_status" ON "petty_cash_requests"("status");
CREATE INDEX IF NOT EXISTS "idx_petty_cash_requests_requestDate" ON "petty_cash_requests"("requestDate");


CREATE INDEX IF NOT EXISTS "idx_notifications_storeId" ON "notifications"("storeId");
CREATE INDEX IF NOT EXISTS "idx_notifications_type" ON "notifications"("type");
CREATE INDEX IF NOT EXISTS "idx_notifications_isRead" ON "notifications"("isRead");
CREATE INDEX IF NOT EXISTS "idx_notifications_sentAt" ON "notifications"("sentAt");


CREATE INDEX IF NOT EXISTS "idx_approval_logs_referenceId" ON "approval_logs"("referenceId");
CREATE INDEX IF NOT EXISTS "idx_approval_logs_storeId" ON "approval_logs"("storeId");
