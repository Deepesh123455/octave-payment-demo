-- CreateEnum
CREATE TYPE "StoreStatus" AS ENUM ('Active', 'Inactive', 'Under_Renovation');

-- CreateEnum
CREATE TYPE "StoreType" AS ENUM ('Mall', 'High_Street');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('Paid', 'Pending', 'Overdue', 'Approved', 'Pending_Approval', 'Cancelled', 'Rejected');

-- CreateEnum
CREATE TYPE "UtilityType" AS ENUM ('Electricity', 'Water', 'Internet', 'CAM', 'DG');

-- CreateEnum
CREATE TYPE "PettyCashStatus" AS ENUM ('Approved', 'Pending', 'Rejected', 'Escalated', 'Auto_Approved', 'Pending_CFO', 'Paid');

-- CreateEnum
CREATE TYPE "ApprovalAction" AS ENUM ('Approved', 'Rejected', 'Pending', 'Escalated');

-- CreateEnum
CREATE TYPE "TallyImportStatus" AS ENUM ('Imported', 'Pending', 'Error', 'Skipped');

-- CreateEnum
CREATE TYPE "PaymentMode" AS ENUM ('UPI', 'NEFT', 'RTGS', 'Cheque', 'Petty_Cash_Float', 'Bank_Transfer');

-- CreateTable
CREATE TABLE "Admin" (
    "id" TEXT NOT NULL,
    "emailEncrypted" TEXT NOT NULL,
    "emailHash" TEXT NOT NULL,
    "roleEncrypted" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "landlords" (
    "id" TEXT NOT NULL,
    "landlordId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "contactPerson" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "panNumber" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "bankAccount" TEXT NOT NULL,
    "ifscCode" TEXT NOT NULL,
    "gstNumber" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "landlords_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stores" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "storeName" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "mallOrMarket" TEXT NOT NULL,
    "type" "StoreType" NOT NULL,
    "managerName" TEXT NOT NULL,
    "managerEmail" TEXT NOT NULL,
    "managerPhone" TEXT NOT NULL,
    "zoneManager" TEXT NOT NULL,
    "landlordId" TEXT NOT NULL,
    "monthlyRent" INTEGER NOT NULL,
    "rentDueDay" INTEGER NOT NULL,
    "securityDeposit" INTEGER NOT NULL,
    "leaseStartDate" TIMESTAMP(3) NOT NULL,
    "leaseEndDate" TIMESTAMP(3) NOT NULL,
    "pettyCashLimit" INTEGER NOT NULL,
    "openingDate" TIMESTAMP(3) NOT NULL,
    "storeStatus" "StoreStatus" NOT NULL,
    "squareFeet" INTEGER NOT NULL,
    "bankAccountLast4" TEXT NOT NULL,
    "tallyCostCenter" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rent_payments" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "landlordId" TEXT NOT NULL,
    "paymentMonth" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "latePenalty" INTEGER NOT NULL DEFAULT 0,
    "totalPaid" INTEGER NOT NULL DEFAULT 0,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paymentDate" TIMESTAMP(3),
    "paymentMode" "PaymentMode" NOT NULL,
    "utrReference" TEXT,
    "status" "PaymentStatus" NOT NULL,
    "tdsDeducted" INTEGER NOT NULL DEFAULT 0,
    "gst" INTEGER NOT NULL DEFAULT 0,
    "netPayable" INTEGER NOT NULL,
    "invoiceNumber" TEXT,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rent_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "utility_bills" (
    "id" TEXT NOT NULL,
    "billId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "utilityType" "UtilityType" NOT NULL,
    "providerName" TEXT NOT NULL,
    "billMonth" TEXT NOT NULL,
    "billAmount" INTEGER NOT NULL,
    "consumerNumber" TEXT,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paymentDate" TIMESTAMP(3),
    "paymentMode" "PaymentMode",
    "transactionId" TEXT,
    "status" "PaymentStatus" NOT NULL,
    "meterReading" INTEGER,
    "unitsConsumed" INTEGER,
    "tallyLedger" TEXT NOT NULL,
    "tallyCostCenter" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "utility_bills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "petty_cash_requests" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "requestDate" TIMESTAMP(3) NOT NULL,
    "amount" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "vendorName" TEXT,
    "billNumber" TEXT,
    "status" "PettyCashStatus" NOT NULL,
    "approvedBy" TEXT,
    "approvalDate" TIMESTAMP(3),
    "paymentMode" "PaymentMode",
    "tallyVoucherType" TEXT,
    "tallyLedger" TEXT,
    "tallyCostCenter" TEXT,
    "remarks" TEXT,
    "paymentDate" TIMESTAMP(3),
    "transactionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "petty_cash_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approval_logs" (
    "id" TEXT NOT NULL,
    "logId" TEXT NOT NULL,
    "referenceType" TEXT NOT NULL,
    "referenceId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "approverName" TEXT NOT NULL,
    "approverRole" TEXT NOT NULL,
    "approverEmail" TEXT NOT NULL,
    "action" "ApprovalAction" NOT NULL,
    "actionDate" TIMESTAMP(3) NOT NULL,
    "amount" INTEGER NOT NULL,
    "comments" TEXT,
    "level" INTEGER NOT NULL DEFAULT 1,
    "ipAddress" TEXT,
    "rentPaymentId" TEXT,
    "utilityBillId" TEXT,
    "pettyCashId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "approval_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tally_import_records" (
    "id" TEXT NOT NULL,
    "importId" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "voucherDate" TIMESTAMP(3) NOT NULL,
    "voucherType" TEXT NOT NULL,
    "debitLedger" TEXT NOT NULL,
    "creditLedger" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "tdsAmount" INTEGER NOT NULL DEFAULT 0,
    "netPayable" INTEGER NOT NULL,
    "costCenter" TEXT NOT NULL,
    "narration" TEXT NOT NULL,
    "voucherNumber" TEXT NOT NULL,
    "importStatus" "TallyImportStatus" NOT NULL,
    "importDate" TIMESTAMP(3) NOT NULL,
    "tallyCompany" TEXT NOT NULL,
    "financialYear" TEXT NOT NULL,
    "rentPaymentId" TEXT,
    "utilityBillId" TEXT,
    "pettyCashId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tally_import_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "adminEmail" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "emailSent" BOOLEAN NOT NULL DEFAULT false,
    "rentPaymentId" TEXT,
    "utilityBillId" TEXT,
    "pettyCashId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Admin_emailHash_key" ON "Admin"("emailHash");

-- CreateIndex
CREATE UNIQUE INDEX "landlords_landlordId_key" ON "landlords"("landlordId");

-- CreateIndex
CREATE UNIQUE INDEX "stores_storeId_key" ON "stores"("storeId");

-- CreateIndex
CREATE UNIQUE INDEX "rent_payments_paymentId_key" ON "rent_payments"("paymentId");

-- CreateIndex
CREATE UNIQUE INDEX "utility_bills_billId_key" ON "utility_bills"("billId");

-- CreateIndex
CREATE UNIQUE INDEX "petty_cash_requests_requestId_key" ON "petty_cash_requests"("requestId");

-- CreateIndex
CREATE UNIQUE INDEX "approval_logs_logId_key" ON "approval_logs"("logId");

-- CreateIndex
CREATE UNIQUE INDEX "tally_import_records_importId_key" ON "tally_import_records"("importId");

-- CreateIndex
CREATE UNIQUE INDEX "tally_import_records_voucherNumber_key" ON "tally_import_records"("voucherNumber");

-- AddForeignKey
ALTER TABLE "stores" ADD CONSTRAINT "stores_landlordId_fkey" FOREIGN KEY ("landlordId") REFERENCES "landlords"("landlordId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rent_payments" ADD CONSTRAINT "rent_payments_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("storeId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rent_payments" ADD CONSTRAINT "rent_payments_landlordId_fkey" FOREIGN KEY ("landlordId") REFERENCES "landlords"("landlordId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "utility_bills" ADD CONSTRAINT "utility_bills_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("storeId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "petty_cash_requests" ADD CONSTRAINT "petty_cash_requests_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("storeId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_logs" ADD CONSTRAINT "approval_logs_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("storeId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_logs" ADD CONSTRAINT "approval_logs_rentPaymentId_fkey" FOREIGN KEY ("rentPaymentId") REFERENCES "rent_payments"("paymentId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_logs" ADD CONSTRAINT "approval_logs_utilityBillId_fkey" FOREIGN KEY ("utilityBillId") REFERENCES "utility_bills"("billId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_logs" ADD CONSTRAINT "approval_logs_pettyCashId_fkey" FOREIGN KEY ("pettyCashId") REFERENCES "petty_cash_requests"("requestId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tally_import_records" ADD CONSTRAINT "tally_import_records_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("storeId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tally_import_records" ADD CONSTRAINT "tally_import_records_rentPaymentId_fkey" FOREIGN KEY ("rentPaymentId") REFERENCES "rent_payments"("paymentId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tally_import_records" ADD CONSTRAINT "tally_import_records_utilityBillId_fkey" FOREIGN KEY ("utilityBillId") REFERENCES "utility_bills"("billId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tally_import_records" ADD CONSTRAINT "tally_import_records_pettyCashId_fkey" FOREIGN KEY ("pettyCashId") REFERENCES "petty_cash_requests"("requestId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("storeId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_rentPaymentId_fkey" FOREIGN KEY ("rentPaymentId") REFERENCES "rent_payments"("paymentId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_utilityBillId_fkey" FOREIGN KEY ("utilityBillId") REFERENCES "utility_bills"("billId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_pettyCashId_fkey" FOREIGN KEY ("pettyCashId") REFERENCES "petty_cash_requests"("requestId") ON DELETE SET NULL ON UPDATE CASCADE;
