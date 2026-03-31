// prisma/seed.ts
// Run with: npx ts-node prisma/seed.ts
// Or add to package.json:
//   "prisma": { "seed": "ts-node prisma/seed.ts" }
// Then run: npx prisma db seed
/// <reference types="node" />
import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import path from "node:path";
import "dotenv/config";
import { encryptEmail, encryptRole, blindIndex } from "../utils/crypto";

const prisma = new PrismaClient();

// ─── Load raw JSON ───────────────────────────────────────────────────────────
const raw = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, "../data/octave_apparels_synthetic_dataset.json"),
    "utf-8",
  ),
);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toDate(val: string | null | undefined): Date | null {
  if (!val) return null;
  return new Date(val);
}

function toDateRequired(val: string): Date {
  return new Date(val);
}

// Map JSON string values to Prisma enum values
function mapStoreStatus(s: string) {
  const map: Record<string, string> = {
    Active: "Active",
    Inactive: "Inactive",
    "Under Renovation": "Under_Renovation",
  };
  return (map[s] ?? "Active") as any;
}

function mapStoreType(s: string) {
  return (s === "Mall" ? "Mall" : "High_Street") as any;
}

function mapPaymentStatus(s: string) {
  const map: Record<string, string> = {
    Paid: "Paid",
    Pending: "Pending",
    Overdue: "Overdue",
    "Pending Approval": "Pending_Approval",
    Cancelled: "Cancelled",
  };
  return (map[s] ?? "Pending") as any;
}

function mapUtilityType(s: string) {
  const map: Record<string, string> = {
    Electricity: "Electricity",
    Water: "Water",
    Internet: "Internet",
    CAM: "CAM",
    DG: "DG",
  };
  return (map[s] ?? "Electricity") as any;
}

function mapPettyCashStatus(s: string) {
  const map: Record<string, string> = {
    Approved: "Approved",
    Pending: "Pending",
    Rejected: "Rejected",
    Escalated: "Escalated",
    "Auto Approved": "Auto_Approved",
    "Pending CFO": "Pending_CFO",
    Paid: "Paid",
  };
  return (map[s] ?? "Pending") as any;
}

function mapApprovalAction(s: string) {
  const map: Record<string, string> = {
    Approved: "Approved",
    Rejected: "Rejected",
    Pending: "Pending",
    Escalated: "Escalated",
  };
  return (map[s] ?? "Pending") as any;
}

function mapTallyStatus(s: string) {
  const map: Record<string, string> = {
    Imported: "Imported",
    Pending: "Pending",
    Error: "Error",
    Skipped: "Skipped",
  };
  return (map[s] ?? "Pending") as any;
}

function mapPaymentMode(s: string | null | undefined) {
  if (!s) return null;
  const map: Record<string, string> = {
    UPI: "UPI",
    NEFT: "NEFT",
    RTGS: "RTGS",
    Cheque: "Cheque",
    "Petty Cash Float": "Petty_Cash_Float",
    "Bank Transfer": "Bank_Transfer",
  };
  return (map[s] ?? "UPI") as any;
}

// ─── Seed Functions ───────────────────────────────────────────────────────────

async function seedLandlords() {
  console.log("🏢 Seeding landlords...");
  const rows = raw.landlords.map((l: any) => ({
    landlordId: l.landlord_id,
    companyName: l.company_name,
    contactPerson: l.contact_person,
    email: l.email,
    phone: l.phone,
    panNumber: l.pan_number,
    bankName: l.bank_name,
    bankAccount: l.bank_account,
    ifscCode: l.ifsc_code,
    gstNumber: l.gst_number,
    address: l.address,
  }));

  await prisma.landlord.createMany({ data: rows, skipDuplicates: true });
  console.log(`   ✓ ${rows.length} landlords`);
}

async function seedStores() {
  console.log("🏪 Seeding stores...");
  const rows = raw.stores.map((s: any) => ({
    storeId: s.store_id,
    storeName: s.store_name,
    city: s.city,
    state: s.state,
    region: s.region,
    mallOrMarket: s.mall_or_market,
    type: mapStoreType(s.type),
    managerName: s.store_manager_name,
    managerEmail: s.manager_email,
    managerPhone: s.manager_phone,
    zoneManager: s.zone_manager,
    landlordId: s.landlord_id,
    monthlyRent: s.monthly_rent,
    rentDueDay: s.rent_due_day,
    securityDeposit: s.security_deposit,
    leaseStartDate: toDateRequired(s.lease_start_date),
    leaseEndDate: toDateRequired(s.lease_end_date),
    pettyCashLimit: s.petty_cash_limit,
    openingDate: toDateRequired(s.opening_date),
    storeStatus: mapStoreStatus(s.store_status),
    squareFeet: s.square_feet,
    bankAccountLast4: s.bank_account_last4,
    tallyCostCenter: s.tally_cost_center,
  }));

  await prisma.store.createMany({ data: rows, skipDuplicates: true });
  console.log(`   ✓ ${rows.length} stores`);
}

async function seedAdmin() {
  console.log("🔒 Seeding the Zero-Trust Admins...");

  const demoAdmins = [
    {
      rawEmail: "deepeshthakur802@gmail.com",
      rawRole: "SUPER_ADMIN" as const,
    },
    {
      rawEmail: "deepesh8021@gmail.com",
      rawRole: "FINANCE_ADMIN" as const,
    },
    {
      rawEmail: "deeth2468@gmail.com",
      rawRole: "EXPENSE_VIEWER" as const,
    },
    {
      rawEmail: "democfo@gmail.com",
      rawRole: "SUPER_ADMIN" as const,
    },
  ];

  // Map raw data through the crypto utility
  const secureAdmin = demoAdmins.map((admin) => ({
    emailHash: blindIndex(admin.rawEmail),
    emailEncrypted: encryptEmail(admin.rawEmail),
    roleEncrypted: encryptRole(admin.rawRole),
  }));

  // Safely inject into the database
  for (const admin of secureAdmin) {
    await prisma.admin.upsert({
      where: {
        emailHash: admin.emailHash,
      },
      update: {}, // Do nothing if the admin already exists
      create: {
        emailHash: admin.emailHash,
        emailEncrypted: admin.emailEncrypted,
        roleEncrypted: admin.roleEncrypted,
      },
    });
  }

  console.log(`✅ Successfully seeded ${secureAdmin.length} admins.`);
}

async function seedRentPayments() {
  console.log("💰 Seeding rent payments...");
  const rows = raw.rent_payments.map((r: any) => ({
    paymentId: r.payment_id,
    storeId: r.store_id,
    landlordId: r.landlord_id,
    paymentMonth: r.payment_month,
    amount: r.amount,
    latePenalty: r.late_penalty ?? 0,
    totalPaid: r.total_paid ?? 0,
    dueDate: toDateRequired(r.due_date),
    paymentDate: toDate(r.payment_date),
    paymentMode: mapPaymentMode(r.payment_mode),
    utrReference: r.utr_reference ?? null,
    status: mapPaymentStatus(r.status),
    tdsDeducted: r.tds_deducted ?? 0,
    gst: r.gst ?? 0,
    // Calculate netPayable: amount + gst - tds
    netPayable: (r.amount ?? 0) + (r.gst ?? 0) - (r.tds_deducted ?? 0),
    invoiceNumber: r.invoice_number ?? null,
    remarks: r.remarks ?? null,
  }));

  // Batch insert in chunks of 100 to avoid hitting PG limits
  for (let i = 0; i < rows.length; i += 100) {
    await prisma.rentPayment.createMany({
      data: rows.slice(i, i + 100),
      skipDuplicates: true,
    });
  }
  console.log(`   ✓ ${rows.length} rent payments`);
}

async function seedUtilityBills() {
  console.log("⚡ Seeding utility bills...");
  const rows = raw.utility_bills.map((u: any) => ({
    billId: u.bill_id,
    storeId: u.store_id,
    utilityType: mapUtilityType(u.utility_type),
    providerName: u.provider_name,
    billMonth: u.bill_month,
    billAmount: u.bill_amount,
    consumerNumber: u.consumer_number ?? null,
    dueDate: toDateRequired(u.due_date),
    paymentDate: toDate(u.payment_date),
    paymentMode: mapPaymentMode(u.payment_mode),
    transactionId: u.transaction_id ?? null,
    status: mapPaymentStatus(u.status),
    meterReading: u.meter_reading ?? null,
    unitsConsumed: u.units_consumed ?? null,
    tallyLedger: u.tally_ledger,
    tallyCostCenter: u.tally_cost_center,
  }));

  for (let i = 0; i < rows.length; i += 100) {
    await prisma.utilityBill.createMany({
      data: rows.slice(i, i + 100),
      skipDuplicates: true,
    });
  }
  console.log(`   ✓ ${rows.length} utility bills`);
}

async function seedPettyCash() {
  console.log("💵 Seeding petty cash requests...");
  const rows = raw.petty_cash_requests.map((p: any) => ({
    requestId: p.request_id,
    storeId: p.store_id,
    requestedBy: p.requested_by,
    requestDate: toDateRequired(p.request_date),
    amount: p.amount,
    category: p.category,
    description: p.description,
    vendorName: p.vendor_name ?? null,
    billNumber: p.bill_number ?? null,
    status: mapPettyCashStatus(p.status),
    approvedBy: p.approved_by ?? null,
    approvalDate: toDate(p.approval_date),
    paymentMode: mapPaymentMode(p.payment_mode),
    tallyVoucherType: p.tally_voucher_type ?? null,
    tallyLedger: p.tally_ledger ?? null,
    tallyCostCenter: p.tally_cost_center ?? null,
    remarks: p.remarks ?? null,
    paymentDate: toDate(p.payment_date),
    transactionId: p.transaction_id ?? null,
  }));

  for (let i = 0; i < rows.length; i += 100) {
    await prisma.pettyCashRequest.createMany({
      data: rows.slice(i, i + 100),
      skipDuplicates: true,
    });
  }
  console.log(`   ✓ ${rows.length} petty cash requests`);
}

async function seedApprovalLogs() {
  console.log("✅ Seeding approval logs...");
  const rows = raw.approval_logs.map((a: any) => {
    // Wire up the polymorphic FK based on reference_type
    const isRent = a.reference_type === "Rent Payment";
    const isUtility = a.reference_type === "Utility Bill";
    const isPetty = a.reference_type === "Petty Cash";

    return {
      logId: a.log_id,
      referenceType: a.reference_type,
      referenceId: a.reference_id,
      storeId: a.store_id,
      approverName: a.approver_name,
      approverRole: a.approver_role,
      approverEmail: a.approver_email,
      action: mapApprovalAction(a.action),
      actionDate: toDateRequired(a.action_date),
      amount: a.amount,
      comments: a.comments ?? null,
      level: a.level ?? 1,
      ipAddress: a.ip_address ?? null,
      rentPaymentId: isRent ? a.reference_id : null,
      utilityBillId: isUtility ? a.reference_id : null,
      pettyCashId: isPetty ? a.reference_id : null,
    };
  });

  for (let i = 0; i < rows.length; i += 100) {
    await prisma.approvalLog.createMany({
      data: rows.slice(i, i + 100),
      skipDuplicates: true,
    });
  }
  console.log(`   ✓ ${rows.length} approval logs`);
}

async function seedTallyImports() {
  console.log("📒 Seeding tally import records...");
  const rows = raw.tally_import_records.map((t: any) => {
    const isRent = t.source_type === "Rent Payment";
    const isUtility = t.source_type === "Utility Bill";
    const isPetty = t.source_type === "Petty Cash";

    return {
      importId: t.import_id,
      sourceType: t.source_type,
      sourceId: t.source_id,
      storeId: t.store_id,
      voucherDate: toDateRequired(t.voucher_date),
      voucherType: t.voucher_type,
      debitLedger: t.debit_ledger,
      creditLedger: t.credit_ledger,
      amount: t.amount,
      tdsAmount: t.tds_amount ?? 0,
      netPayable: t.net_payable,
      costCenter: t.cost_center,
      narration: t.narration,
      voucherNumber: t.voucher_number,
      importStatus: mapTallyStatus(t.import_status),
      importDate: toDateRequired(t.import_date),
      tallyCompany: t.tally_company,
      financialYear: t.financial_year,
      rentPaymentId: isRent ? t.source_id : null,
      utilityBillId: isUtility ? t.source_id : null,
      pettyCashId: isPetty ? t.source_id : null,
    };
  });

  for (let i = 0; i < rows.length; i += 100) {
    await prisma.tallyImportRecord.createMany({
      data: rows.slice(i, i + 100),
      skipDuplicates: true,
    });
  }
  console.log(`   ✓ ${rows.length} tally import records`);
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n🚀 Starting Octave Apparels seed...\n");

  // Order matters — respect FK dependencies
  await seedAdmin(); // no deps
  await seedLandlords(); // no deps
  await seedStores(); // depends on: Landlord
  await seedRentPayments(); // depends on: Store, Landlord
  await seedUtilityBills(); // depends on: Store
  await seedPettyCash(); // depends on: Store
  await seedApprovalLogs(); // depends on: Store, RentPayment, UtilityBill, PettyCash
  await seedTallyImports(); // depends on: Store, RentPayment, UtilityBill, PettyCash

  console.log("\n✅ Seed complete!\n");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
