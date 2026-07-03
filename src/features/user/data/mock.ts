import {
  Phone, Wifi, Tv, GraduationCap, Gift,
  ArrowUpRight, ArrowDownLeft, Plus, Building2, Zap,
  type LucideIcon,
} from "lucide-react";

// ─── Utilities ─────────────────────────────────────────────────────────────────
export const fmt = (n: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency", currency: "NGN", minimumFractionDigits: 2,
  }).format(n);

export const fmtCompact = (n: number) =>
  n >= 1_000_000
    ? `₦${(n / 1_000_000).toFixed(1)}M`
    : n >= 1_000
    ? `₦${(n / 1_000).toFixed(0)}K`
    : `₦${n}`;

export const chartValue = (value: unknown) =>
  typeof value === "number" ? value : Number(value ?? 0);

// ─── Mock User ─────────────────────────────────────────────────────────────────
export const mockUser = {
  name: "Chukwuemeka Obi",
  email: "emeka.obi@gmail.com",
  phone: "+234 801 234 5678",
  balance: 45820.5,
  accountNumber: "0123456789",
  joinedDate: "March 2024",
  referralCode: "EMEKA2024",
  referralEarnings: 4500,
  referralCount: 9,
};

// ─── Chart Data ────────────────────────────────────────────────────────────────
export const spendingData = [
  { day: "Mon", amount: 2400, credit: 0 },
  { day: "Tue", amount: 1398, credit: 5000 },
  { day: "Wed", amount: 3800, credit: 0 },
  { day: "Thu", amount: 2908, credit: 20000 },
  { day: "Fri", amount: 4800, credit: 0 },
  { day: "Sat", amount: 1800, credit: 3000 },
  { day: "Sun", amount: 950, credit: 0 },
];

// ─── Transactions ──────────────────────────────────────────────────────────────
export type Transaction = {
  id: string;
  icon: LucideIcon;
  desc: string;
  detail: string;
  amount: number;
  date: string;
  status: string;
  ref: string;
  network: string;
};

export const transactions: Transaction[] = [
  { id: "TXN001", icon: Phone, desc: "MTN Airtime", detail: "08012345678", amount: -500, date: "Today, 2:30 PM", status: "success", ref: "VTU20240629001", network: "MTN" },
  { id: "TXN002", icon: Wifi, desc: "Airtel Data Bundle", detail: "2GB · 30 Days", amount: -1500, date: "Today, 11:15 AM", status: "success", ref: "VTU20240629002", network: "Airtel" },
  { id: "TXN003", icon: ArrowDownLeft, desc: "Wallet Funding", detail: "Bank Transfer", amount: 20000, date: "Yesterday, 4:00 PM", status: "success", ref: "VTU20240628001", network: "" },
  { id: "TXN004", icon: Zap, desc: "EKEDC Prepaid", detail: "0101234567890", amount: -5000, date: "Yesterday, 2:18 PM", status: "success", ref: "VTU20240628002", network: "" },
  { id: "TXN005", icon: Tv, desc: "DSTV Subscription", detail: "Compact Package", amount: -7900, date: "Jun 27, 9:30 AM", status: "success", ref: "VTU20240627001", network: "" },
  { id: "TXN006", icon: ArrowUpRight, desc: "Bank Transfer", detail: "First Bank · John Doe", amount: -10000, date: "Jun 26, 3:45 PM", status: "failed", ref: "VTU20240626001", network: "" },
  { id: "TXN007", icon: Phone, desc: "Glo Airtime", detail: "08087654321", amount: -1000, date: "Jun 26, 1:20 PM", status: "success", ref: "VTU20240626002", network: "Glo" },
  { id: "TXN008", icon: ArrowDownLeft, desc: "Wallet Funding", detail: "Paystack", amount: 15000, date: "Jun 25, 8:00 AM", status: "pending", ref: "VTU20240625001", network: "" },
  { id: "TXN009", icon: GraduationCap, desc: "WAEC Registration", detail: "2024/2025 Session", amount: -17500, date: "Jun 24, 10:00 AM", status: "success", ref: "VTU20240624001", network: "" },
  { id: "TXN010", icon: Gift, desc: "Amazon Gift Card", detail: "$50 USD", amount: -48000, date: "Jun 23, 3:15 PM", status: "success", ref: "VTU20240623001", network: "" },
];

// ─── Services ──────────────────────────────────────────────────────────────────
export type Service = {
  id: string;
  label: string;
  icon: LucideIcon;
  color: string;
  description: string;
};

export const services: Service[] = [
  { id: "airtime", label: "Buy Airtime", icon: Phone, color: "bg-blue-50 text-blue-600", description: "Top up any network" },
  { id: "data", label: "Buy Data", icon: Wifi, color: "bg-indigo-50 text-indigo-600", description: "All networks available" },
  { id: "cable", label: "Cable TV", icon: Tv, color: "bg-purple-50 text-purple-600", description: "DSTV, GOtv, Startimes" },
  { id: "electricity", label: "Electricity", icon: Zap, color: "bg-yellow-50 text-yellow-600", description: "All DISCOs supported" },
  { id: "education", label: "Education", icon: GraduationCap, color: "bg-green-50 text-green-600", description: "WAEC, JAMB, NECO" },
  { id: "giftcard", label: "Gift Cards", icon: Gift, color: "bg-rose-50 text-rose-600", description: "Buy & redeem gift cards" },
  { id: "transfer", label: "Bank Transfer", icon: Building2, color: "bg-teal-50 text-teal-600", description: "All Nigerian banks" },
  { id: "fund", label: "Fund Wallet", icon: Plus, color: "bg-emerald-50 text-emerald-600", description: "Add money to wallet" },
];

// ─── Beneficiaries ─────────────────────────────────────────────────────────────
export type Beneficiary = {
  id: number;
  name: string;
  initials: string;
  color: string;
  type: "airtime" | "data" | "bank";
  phone?: string;
  network?: string;
  bank?: string;
  account?: string;
};

export const beneficiaries: Beneficiary[] = [
  { id: 1, name: "Adaeze Nwosu", phone: "08034567890", network: "MTN", type: "airtime", initials: "AN", color: "bg-yellow-100 text-yellow-700" },
  { id: 2, name: "Emeka Chibuike", phone: "08123456789", network: "Airtel", type: "data", initials: "EC", color: "bg-red-100 text-red-700" },
  { id: 3, name: "Fatima Bello", phone: "09056789012", network: "Glo", type: "airtime", initials: "FB", color: "bg-green-100 text-green-700" },
  { id: 4, name: "Kunle Adeleke", bank: "GTBank", account: "0123456789", type: "bank", initials: "KA", color: "bg-blue-100 text-blue-700" },
  { id: 5, name: "Ngozi Okafor", bank: "Access Bank", account: "9876543210", type: "bank", initials: "NO", color: "bg-purple-100 text-purple-700" },
  { id: 6, name: "Tunde Bakare", phone: "08078901234", network: "9mobile", type: "airtime", initials: "TB", color: "bg-indigo-100 text-indigo-700" },
];
