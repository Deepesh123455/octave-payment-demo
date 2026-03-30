export interface Store {
  id: string;
  name: string;
  city: string;
  address: string;
  monthlyRent: number;
  manager: string;
  managerPhone: string;
  status: "active" | "inactive";
  landlord: string;
  leaseStart: string;
  leaseEnd: string;
  sqft: number;
}

export interface RentRecord {
  id: string;
  storeId: string;
  storeName: string;
  landlord: string;
  month: string;
  rentAmount: number;
  gst: number;
  tds: number;
  netPayable: number;
  dueDate: string;
  status: "paid" | "pending" | "overdue";
}

export interface UtilityBill {
  id: string;
  storeId: string;
  storeName: string;
  type: "electricity" | "internet" | "water" | "cam" | "dg";
  provider: string;
  amount: number;
  dueDate: string;
  status: "paid" | "pending" | "overdue";
  month: string;
}

export interface PettyCashRequest {
  id: string;
  storeId: string;
  storeName: string;
  requestedBy: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  status: "auto_approved" | "pending_cfo" | "escalated" | "approved" | "rejected";
  receiptUrl?: string;
}

export interface ApprovalItem {
  id: string;
  type: "rent" | "utility" | "petty_cash";
  storeId: string;
  storeName: string;
  amount: number;
  dueDate: string;
  category: string;
  description: string;
  status: "pending";
}

export const stores: Store[] = [
  {
    id: "OCP-001",
    name: "Octave Connaught Place",
    city: "New Delhi",
    address: "N-14, Connaught Place, New Delhi 110001",
    monthlyRent: 185000,
    manager: "Rajesh Kumar",
    managerPhone: "+91 98765 43210",
    status: "active",
    landlord: "DLF Properties Ltd",
    leaseStart: "2023-04-01",
    leaseEnd: "2028-03-31",
    sqft: 2400,
  },
  {
    id: "OSC-002",
    name: "Octave Select Citywalk",
    city: "New Delhi",
    address: "Select Citywalk, Saket, New Delhi 110017",
    monthlyRent: 210000,
    manager: "Priya Sharma",
    managerPhone: "+91 98765 43211",
    status: "active",
    landlord: "Select Infrastructure Pvt Ltd",
    leaseStart: "2022-08-01",
    leaseEnd: "2027-07-31",
    sqft: 3200,
  },
  {
    id: "OMG-003",
    name: "Octave MG Road Gurgaon",
    city: "Gurgaon",
    address: "MG Road, Sector 28, Gurgaon 122002",
    monthlyRent: 175000,
    manager: "Amit Verma",
    managerPhone: "+91 98765 43212",
    status: "active",
    landlord: "Raheja Developers",
    leaseStart: "2023-01-01",
    leaseEnd: "2027-12-31",
    sqft: 2100,
  },
];

export const rentRecords: RentRecord[] = [
  {
    id: "R001",
    storeId: "OCP-001",
    storeName: "Octave Connaught Place",
    landlord: "DLF Properties Ltd",
    month: "March 2026",
    rentAmount: 185000,
    gst: 33300,
    tds: 18500,
    netPayable: 199800,
    dueDate: "2026-03-05",
    status: "overdue",
  },
  {
    id: "R002",
    storeId: "OSC-002",
    storeName: "Octave Select Citywalk",
    landlord: "Select Infrastructure Pvt Ltd",
    month: "March 2026",
    rentAmount: 210000,
    gst: 37800,
    tds: 21000,
    netPayable: 226800,
    dueDate: "2026-03-10",
    status: "pending",
  },
  {
    id: "R003",
    storeId: "OMG-003",
    storeName: "Octave MG Road Gurgaon",
    landlord: "Raheja Developers",
    month: "March 2026",
    rentAmount: 175000,
    gst: 31500,
    tds: 17500,
    netPayable: 189000,
    dueDate: "2026-03-15",
    status: "pending",
  },
  {
    id: "R004",
    storeId: "OCP-001",
    storeName: "Octave Connaught Place",
    landlord: "DLF Properties Ltd",
    month: "February 2026",
    rentAmount: 185000,
    gst: 33300,
    tds: 18500,
    netPayable: 199800,
    dueDate: "2026-02-05",
    status: "paid",
  },
  {
    id: "R005",
    storeId: "OSC-002",
    storeName: "Octave Select Citywalk",
    landlord: "Select Infrastructure Pvt Ltd",
    month: "February 2026",
    rentAmount: 210000,
    gst: 37800,
    tds: 21000,
    netPayable: 226800,
    dueDate: "2026-02-10",
    status: "paid",
  },
  {
    id: "R006",
    storeId: "OMG-003",
    storeName: "Octave MG Road Gurgaon",
    landlord: "Raheja Developers",
    month: "February 2026",
    rentAmount: 175000,
    gst: 31500,
    tds: 17500,
    netPayable: 189000,
    dueDate: "2026-02-15",
    status: "paid",
  },
];

export const utilityBills: UtilityBill[] = [
  // Connaught Place
  { id: "U001", storeId: "OCP-001", storeName: "Octave Connaught Place", type: "electricity", provider: "BSES Rajdhani", amount: 28500, dueDate: "2026-03-20", status: "pending", month: "March 2026" },
  { id: "U002", storeId: "OCP-001", storeName: "Octave Connaught Place", type: "internet", provider: "Airtel Business", amount: 3000, dueDate: "2026-03-15", status: "pending", month: "March 2026" },
  { id: "U003", storeId: "OCP-001", storeName: "Octave Connaught Place", type: "water", provider: "Delhi Jal Board", amount: 4500, dueDate: "2026-03-18", status: "paid", month: "March 2026" },
  { id: "U004", storeId: "OCP-001", storeName: "Octave Connaught Place", type: "cam", provider: "DLF Properties", amount: 15000, dueDate: "2026-03-10", status: "overdue", month: "March 2026" },
  { id: "U005", storeId: "OCP-001", storeName: "Octave Connaught Place", type: "dg", provider: "DLF Properties", amount: 8000, dueDate: "2026-03-10", status: "pending", month: "March 2026" },
  // Select Citywalk
  { id: "U006", storeId: "OSC-002", storeName: "Octave Select Citywalk", type: "electricity", provider: "BSES Yamuna", amount: 32000, dueDate: "2026-03-22", status: "pending", month: "March 2026" },
  { id: "U007", storeId: "OSC-002", storeName: "Octave Select Citywalk", type: "internet", provider: "Jio Fiber", amount: 2999, dueDate: "2026-03-15", status: "paid", month: "March 2026" },
  { id: "U008", storeId: "OSC-002", storeName: "Octave Select Citywalk", type: "water", provider: "Delhi Jal Board", amount: 5200, dueDate: "2026-03-18", status: "pending", month: "March 2026" },
  { id: "U009", storeId: "OSC-002", storeName: "Octave Select Citywalk", type: "cam", provider: "Select Infrastructure", amount: 22000, dueDate: "2026-03-10", status: "pending", month: "March 2026" },
  { id: "U010", storeId: "OSC-002", storeName: "Octave Select Citywalk", type: "dg", provider: "Select Infrastructure", amount: 9500, dueDate: "2026-03-10", status: "paid", month: "March 2026" },
  // MG Road
  { id: "U011", storeId: "OMG-003", storeName: "Octave MG Road Gurgaon", type: "electricity", provider: "DHBVN", amount: 25800, dueDate: "2026-03-20", status: "pending", month: "March 2026" },
  { id: "U012", storeId: "OMG-003", storeName: "Octave MG Road Gurgaon", type: "internet", provider: "Airtel Business", amount: 3000, dueDate: "2026-03-15", status: "pending", month: "March 2026" },
  { id: "U013", storeId: "OMG-003", storeName: "Octave MG Road Gurgaon", type: "water", provider: "GMDA", amount: 3800, dueDate: "2026-03-18", status: "paid", month: "March 2026" },
  { id: "U014", storeId: "OMG-003", storeName: "Octave MG Road Gurgaon", type: "cam", provider: "Raheja Developers", amount: 12000, dueDate: "2026-03-10", status: "overdue", month: "March 2026" },
  { id: "U015", storeId: "OMG-003", storeName: "Octave MG Road Gurgaon", type: "dg", provider: "Raheja Developers", amount: 6500, dueDate: "2026-03-10", status: "pending", month: "March 2026" },
];

export const pettyCashRequests: PettyCashRequest[] = [
  { id: "PC001", storeId: "OCP-001", storeName: "Octave Connaught Place", requestedBy: "Rajesh Kumar", amount: 2500, category: "Store Supplies", description: "Cleaning supplies and hangers", date: "2026-03-25", status: "auto_approved" },
  { id: "PC002", storeId: "OCP-001", storeName: "Octave Connaught Place", requestedBy: "Rajesh Kumar", amount: 7500, category: "Repairs", description: "AC duct cleaning and filter replacement", date: "2026-03-24", status: "pending_cfo" },
  { id: "PC003", storeId: "OSC-002", storeName: "Octave Select Citywalk", requestedBy: "Priya Sharma", amount: 3200, category: "Store Supplies", description: "Shopping bags and tissue paper stock", date: "2026-03-26", status: "auto_approved" },
  { id: "PC004", storeId: "OSC-002", storeName: "Octave Select Citywalk", requestedBy: "Priya Sharma", amount: 8000, category: "Marketing", description: "In-store promotional standees printing", date: "2026-03-23", status: "escalated" },
  { id: "PC005", storeId: "OMG-003", storeName: "Octave MG Road Gurgaon", requestedBy: "Amit Verma", amount: 4200, category: "Maintenance", description: "Plumbing repair for washroom", date: "2026-03-25", status: "pending_cfo" },
  { id: "PC006", storeId: "OMG-003", storeName: "Octave MG Road Gurgaon", requestedBy: "Amit Verma", amount: 1800, category: "Courier", description: "Express courier for sample dispatch", date: "2026-03-26", status: "auto_approved" },
];

export const approvalItems: ApprovalItem[] = [
  { id: "A001", type: "rent", storeId: "OSC-002", storeName: "Octave Select Citywalk", amount: 226800, dueDate: "2026-03-10", category: "Rent", description: "March 2026 rent payment", status: "pending" },
  { id: "A002", type: "rent", storeId: "OMG-003", storeName: "Octave MG Road Gurgaon", amount: 189000, dueDate: "2026-03-15", category: "Rent", description: "March 2026 rent payment", status: "pending" },
  { id: "A003", type: "utility", storeId: "OCP-001", storeName: "Octave Connaught Place", amount: 28500, dueDate: "2026-03-20", category: "Electricity", description: "March electricity bill - BSES Rajdhani", status: "pending" },
  { id: "A004", type: "utility", storeId: "OSC-002", storeName: "Octave Select Citywalk", amount: 32000, dueDate: "2026-03-22", category: "Electricity", description: "March electricity bill - BSES Yamuna", status: "pending" },
  { id: "A005", type: "petty_cash", storeId: "OCP-001", storeName: "Octave Connaught Place", amount: 7500, dueDate: "2026-03-24", category: "Repairs", description: "AC duct cleaning - pending CFO approval", status: "pending" },
  { id: "A006", type: "petty_cash", storeId: "OSC-002", storeName: "Octave Select Citywalk", amount: 8000, dueDate: "2026-03-23", category: "Marketing", description: "Standees printing - escalated", status: "pending" },
  { id: "A007", type: "petty_cash", storeId: "OMG-003", storeName: "Octave MG Road Gurgaon", amount: 4200, dueDate: "2026-03-25", category: "Maintenance", description: "Plumbing repair - pending CFO approval", status: "pending" },
  { id: "A008", type: "utility", storeId: "OMG-003", storeName: "Octave MG Road Gurgaon", amount: 25800, dueDate: "2026-03-20", category: "Electricity", description: "March electricity bill - DHBVN", status: "pending" },
];

export const expenseTrendData = [
  { month: "Oct", rent: 570000, utilities: 145000, petty: 18000 },
  { month: "Nov", rent: 570000, utilities: 152000, petty: 22000 },
  { month: "Dec", rent: 570000, utilities: 168000, petty: 15000 },
  { month: "Jan", rent: 570000, utilities: 158000, petty: 24000 },
  { month: "Feb", rent: 570000, utilities: 148000, petty: 19000 },
  { month: "Mar", rent: 570000, utilities: 161000, petty: 27200 },
];

export const categoryPieData = [
  { name: "Rent", value: 570000, fill: "hsl(var(--chart-1))" },
  { name: "Electricity", value: 86300, fill: "hsl(var(--chart-2))" },
  { name: "CAM Charges", value: 49000, fill: "hsl(var(--chart-3))" },
  { name: "DG Charges", value: 24000, fill: "hsl(var(--chart-4))" },
  { name: "Internet", value: 8999, fill: "hsl(var(--chart-5))" },
  { name: "Petty Cash", value: 27200, fill: "hsl(var(--warning))" },
];

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
};

export const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case "paid":
    case "approved":
    case "auto_approved":
      return "status-paid";
    case "pending":
    case "pending_cfo":
      return "status-pending";
    case "overdue":
    case "escalated":
    case "rejected":
      return "status-overdue";
    default:
      return "";
  }
};

export const getStatusLabel = (status: string) => {
  switch (status) {
    case "paid": return "Paid";
    case "pending": return "Pending Approval";
    case "overdue": return "Overdue";
    case "approved": return "Approved";
    case "auto_approved": return "Auto Approved";
    case "pending_cfo": return "Pending CFO Approval";
    case "escalated": return "Escalated";
    case "rejected": return "Rejected";
    default: return status;
  }
};
