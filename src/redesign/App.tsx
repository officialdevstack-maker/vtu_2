import { useState, useEffect, type ReactElement } from "react";
import {
  LayoutDashboard, Zap, Bell, Settings, User, LogOut, Menu,
  X, ChevronRight, Eye, EyeOff, Phone, Wifi, Tv, GraduationCap,
  Gift, ArrowUpRight, ArrowDownLeft, Plus, Search, CheckCircle,
  XCircle, Clock, AlertCircle, Copy, QrCode, Wallet, HelpCircle,
  ChevronDown, Shield, Smartphone, Building2, Download, ChevronLeft,
  ArrowRight, CreditCard, Receipt, Star, Users, TrendingUp,
  BarChart2, Flag, FileText, Lock, Share2, Send,
  RefreshCw, DollarSign, Activity, Inbox, Database,
  Percent, MoreHorizontal, Layers, Globe,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell,
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────
type Page =
  | "dashboard" | "services" | "transactions" | "wallet"
  | "notifications" | "profile" | "settings" | "support"
  | "referral" | "beneficiaries" | "receipt"
  | "admin-dashboard" | "admin-users" | "admin-transactions"
  | "admin-revenue" | "admin-support" | "admin-fraud" | "admin-reports";

type AuthStep = "login" | "register" | "forgot" | "otp" | "create-pin" | "reset-password";

// ─── Utilities ────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency", currency: "NGN", minimumFractionDigits: 2,
  }).format(n);

const chartValue = (value: unknown) =>
  typeof value === "number" ? value : Number(value ?? 0);

const fmtCompact = (n: number) =>
  n >= 1_000_000
    ? `₦${(n / 1_000_000).toFixed(1)}M`
    : n >= 1_000
    ? `₦${(n / 1_000).toFixed(0)}K`
    : `₦${n}`;

// ─── Mock data ─────────────────────────────────────────────────────────────────
const mockUser = {
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

const spendingData = [
  { day: "Mon", amount: 2400, credit: 0 },
  { day: "Tue", amount: 1398, credit: 5000 },
  { day: "Wed", amount: 3800, credit: 0 },
  { day: "Thu", amount: 2908, credit: 20000 },
  { day: "Fri", amount: 4800, credit: 0 },
  { day: "Sat", amount: 1800, credit: 3000 },
  { day: "Sun", amount: 950, credit: 0 },
];

const adminRevenueData = [
  { month: "Jan", revenue: 4200000, transactions: 18420 },
  { month: "Feb", revenue: 5100000, transactions: 22300 },
  { month: "Mar", revenue: 4800000, transactions: 20100 },
  { month: "Apr", revenue: 6300000, transactions: 27400 },
  { month: "May", revenue: 7100000, transactions: 31200 },
  { month: "Jun", revenue: 8400000, transactions: 36800 },
];

const serviceBreakdown = [
  { name: "Airtime", value: 38, color: "#4F46E5" },
  { name: "Data", value: 27, color: "#10B981" },
  { name: "Electricity", value: 18, color: "#F59E0B" },
  { name: "Cable TV", value: 10, color: "#8B5CF6" },
  { name: "Others", value: 7, color: "#6B7280" },
];

const transactions = [
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

const beneficiaries = [
  { id: 1, name: "Adaeze Nwosu", phone: "08034567890", network: "MTN", type: "airtime", initials: "AN", color: "bg-yellow-100 text-yellow-700" },
  { id: 2, name: "Emeka Chibuike", phone: "08123456789", network: "Airtel", type: "data", initials: "EC", color: "bg-red-100 text-red-700" },
  { id: 3, name: "Fatima Bello", phone: "09056789012", network: "Glo", type: "airtime", initials: "FB", color: "bg-green-100 text-green-700" },
  { id: 4, name: "Kunle Adeleke", bank: "GTBank", account: "0123456789", type: "bank", initials: "KA", color: "bg-blue-100 text-blue-700" },
  { id: 5, name: "Ngozi Okafor", bank: "Access Bank", account: "9876543210", type: "bank", initials: "NO", color: "bg-purple-100 text-purple-700" },
  { id: 6, name: "Tunde Bakare", phone: "08078901234", network: "9mobile", type: "airtime", initials: "TB", color: "bg-indigo-100 text-indigo-700" },
];

const adminUsers = [
  { id: "USR001", name: "Chukwuemeka Obi", email: "emeka.obi@gmail.com", balance: 45820.5, status: "active", kyc: "verified", joined: "Mar 2024", transactions: 47 },
  { id: "USR002", name: "Adaeze Nwosu", email: "adaeze@outlook.com", balance: 12300.0, status: "active", kyc: "verified", joined: "Apr 2024", transactions: 23 },
  { id: "USR003", name: "Kunle Adeleke", email: "kunle.a@gmail.com", balance: 89700.0, status: "active", kyc: "pending", joined: "Jan 2024", transactions: 112 },
  { id: "USR004", name: "Fatima Bello", email: "fatima.b@yahoo.com", balance: 5100.0, status: "suspended", kyc: "verified", joined: "May 2024", transactions: 8 },
  { id: "USR005", name: "Tunde Bakare", email: "tbakare@gmail.com", balance: 0.0, status: "inactive", kyc: "unverified", joined: "Jun 2024", transactions: 2 },
];

const services = [
  { id: "airtime", label: "Buy Airtime", icon: Phone, color: "bg-blue-50 text-blue-600", description: "Top up any network" },
  { id: "data", label: "Buy Data", icon: Wifi, color: "bg-indigo-50 text-indigo-600", description: "All networks available" },
  { id: "cable", label: "Cable TV", icon: Tv, color: "bg-purple-50 text-purple-600", description: "DSTV, GOtv, Startimes" },
  { id: "electricity", label: "Electricity", icon: Zap, color: "bg-yellow-50 text-yellow-600", description: "All DISCOs supported" },
  { id: "education", label: "Education", icon: GraduationCap, color: "bg-green-50 text-green-600", description: "WAEC, JAMB, NECO" },
  { id: "giftcard", label: "Gift Cards", icon: Gift, color: "bg-rose-50 text-rose-600", description: "Buy & redeem gift cards" },
  { id: "transfer", label: "Bank Transfer", icon: Building2, color: "bg-teal-50 text-teal-600", description: "All Nigerian banks" },
  { id: "fund", label: "Fund Wallet", icon: Plus, color: "bg-emerald-50 text-emerald-600", description: "Add money to wallet" },
];

// ─── Shared components ────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    success: "bg-emerald-50 text-emerald-700 border-emerald-100",
    failed: "bg-red-50 text-red-700 border-red-100",
    pending: "bg-amber-50 text-amber-700 border-amber-100",
    verified: "bg-emerald-50 text-emerald-700 border-emerald-100",
    active: "bg-emerald-50 text-emerald-700 border-emerald-100",
    suspended: "bg-red-50 text-red-700 border-red-100",
    inactive: "bg-gray-100 text-gray-500 border-gray-200",
    unverified: "bg-gray-100 text-gray-500 border-gray-200",
  };
  const icons: Record<string, ReactElement> = {
    success: <CheckCircle className="w-3 h-3" />,
    failed: <XCircle className="w-3 h-3" />,
    pending: <Clock className="w-3 h-3" />,
    verified: <CheckCircle className="w-3 h-3" />,
    active: <CheckCircle className="w-3 h-3" />,
    suspended: <XCircle className="w-3 h-3" />,
    inactive: <Clock className="w-3 h-3" />,
    unverified: <AlertCircle className="w-3 h-3" />,
  };
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${styles[status] ?? styles.pending}`}>
      {icons[status] ?? icons.pending}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`w-11 h-6 rounded-full transition-colors relative shrink-0 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${value ? "bg-indigo-600" : "bg-gray-200"}`}
    >
      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${value ? "translate-x-6" : "translate-x-1"}`} />
    </button>
  );
}

function SkeletonLine({ className = "" }: { className?: string }) {
  return <div className={`bg-gray-100 rounded animate-pulse ${className}`} />;
}

function SkeletonCard() {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-5 space-y-3">
      <div className="flex items-center justify-between">
        <SkeletonLine className="h-3 w-24" />
        <SkeletonLine className="h-7 w-7 rounded-lg" />
      </div>
      <SkeletonLine className="h-7 w-32" />
      <SkeletonLine className="h-3 w-16" />
    </div>
  );
}

// ─── Auth Flow ────────────────────────────────────────────────────────────────
function AuthScreen({ onLogin }: { onLogin: () => void }) {
  const [step, setStep] = useState<AuthStep>("login");
  const [showPass, setShowPass] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [pin, setPin] = useState(["", "", "", ""]);
  const [confirmPin, setConfirmPin] = useState(["", "", "", ""]);
  const [pinStep, setPinStep] = useState<"create" | "confirm">("create");
  const [loading, setLoading] = useState(false);

  const inputCls =
    "w-full px-3.5 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition";

  const handleOtpChange = (val: string, idx: number, arr: string[], setArr: (a: string[]) => void) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...arr];
    next[idx] = val.slice(-1);
    setArr(next);
    if (val && idx < arr.length - 1) {
      const el = document.getElementById(`otp-${idx + 1}`);
      el?.focus();
    }
  };

  const simulateLoading = (cb: () => void) => {
    setLoading(true);
    setTimeout(() => { setLoading(false); cb(); }, 1200);
  };

  const BrandPanel = () => (
    <div className="hidden lg:flex lg:w-[460px] bg-indigo-700 flex-col justify-between p-12 relative overflow-hidden shrink-0">
      <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/5" />
      <div className="absolute top-32 left-20 w-64 h-64 rounded-full bg-white/5" />
      <div className="absolute -bottom-16 -left-8 w-56 h-56 rounded-full bg-white/5" />
      <div className="relative z-10 flex items-center gap-2.5">
        <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center">
          <Zap className="w-5 h-5 text-indigo-700" />
        </div>
        <span className="text-white font-semibold text-xl tracking-tight">SwiftVTU</span>
      </div>
      <div className="relative z-10">
        <h1 className="text-4xl font-semibold text-white leading-tight mb-4">Fast. Reliable.<br />Always on.</h1>
        <p className="text-indigo-200 text-base leading-relaxed mb-10">Top up airtime, pay bills, and manage your finances with complete confidence.</p>
        <div className="flex flex-col gap-3">
          {[
            { icon: Shield, text: "Bank-grade security on every transaction" },
            { icon: Zap, text: "Instant delivery across all networks" },
            { icon: Star, text: "Trusted by 50,000+ Nigerians" },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3 text-indigo-200 text-sm">
              <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                <Icon className="w-3.5 h-3.5" />
              </div>
              {text}
            </div>
          ))}
        </div>
      </div>
      <div className="relative z-10 grid grid-cols-3 gap-3">
        {[["50K+", "Active Users"], ["99.9%", "Uptime"], ["₦2B+", "Processed"]].map(([val, label]) => (
          <div key={label} className="bg-white/10 rounded-xl p-4 text-center">
            <div className="text-white font-semibold text-lg">{val}</div>
            <div className="text-indigo-300 text-xs mt-1">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );

  const MobileLogo = () => (
    <div className="lg:hidden flex items-center gap-2 mb-8">
      <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
        <Zap className="w-4 h-4 text-white" />
      </div>
      <span className="font-semibold text-gray-900">SwiftVTU</span>
    </div>
  );

  const LoadingBtn = ({ onClick, children, className = "" }: { onClick: () => void; children: React.ReactNode; className?: string }) => (
    <button
      onClick={onClick}
      disabled={loading}
      className={`w-full font-medium py-2.5 px-4 rounded-lg text-sm transition flex items-center justify-center gap-2 disabled:opacity-70 ${className}`}
    >
      {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : children}
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex font-['Inter',sans-serif]">
      <BrandPanel />

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <MobileLogo />

          {/* ── Login ── */}
          {step === "login" && (
            <>
              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-1">Welcome back</h2>
                <p className="text-gray-500 text-sm">Sign in to your SwiftVTU account</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
                  <input type="email" placeholder="emeka.obi@gmail.com" className={inputCls} />
                </div>
                <div>
                  <div className="flex justify-between mb-1.5">
                    <label className="text-sm font-medium text-gray-700">Password</label>
                    <button onClick={() => setStep("forgot")} className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">Forgot password?</button>
                  </div>
                  <div className="relative">
                    <input type={showPass ? "text" : "password"} placeholder="••••••••" className={inputCls + " pr-10"} />
                    <button onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <LoadingBtn onClick={() => simulateLoading(() => setStep("otp"))} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  Sign in <ArrowRight className="w-4 h-4" />
                </LoadingBtn>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100" /></div>
                  <div className="relative flex justify-center text-xs"><span className="bg-slate-50 px-3 text-gray-400">or</span></div>
                </div>
                <button onClick={onLogin} className="w-full bg-white hover:bg-gray-50 text-gray-700 font-medium py-2.5 px-4 rounded-lg text-sm transition border border-gray-200">
                  Continue with demo access
                </button>
              </div>
              <p className="text-center text-sm text-gray-500 mt-6">
                {"Don't have an account? "}
                <button onClick={() => setStep("register")} className="text-indigo-600 font-medium hover:text-indigo-700">Sign up</button>
              </p>
            </>
          )}

          {/* ── Register ── */}
          {step === "register" && (
            <>
              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-1">Create account</h2>
                <p className="text-gray-500 text-sm">Join SwiftVTU and start transacting instantly</p>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">First name</label>
                    <input type="text" placeholder="Chukwuemeka" className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Last name</label>
                    <input type="text" placeholder="Obi" className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
                  <input type="email" placeholder="emeka.obi@gmail.com" className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone number</label>
                  <div className="flex gap-2">
                    <div className="flex items-center gap-1 px-3 py-2.5 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 shrink-0 whitespace-nowrap">
                      🇳🇬 +234
                    </div>
                    <input type="tel" placeholder="801 234 5678" className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                  <div className="relative">
                    <input type={showPass ? "text" : "password"} placeholder="At least 8 characters" className={inputCls + " pr-10"} />
                    <button onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Referral code <span className="text-gray-400 font-normal">(optional)</span></label>
                  <input type="text" placeholder="e.g. EMEKA2024" className={inputCls} />
                </div>
                <LoadingBtn onClick={() => simulateLoading(() => setStep("otp"))} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  Create account <ArrowRight className="w-4 h-4" />
                </LoadingBtn>
              </div>
              <p className="text-center text-sm text-gray-500 mt-6">
                Already have an account?{" "}
                <button onClick={() => setStep("login")} className="text-indigo-600 font-medium">Sign in</button>
              </p>
            </>
          )}

          {/* ── Forgot password ── */}
          {step === "forgot" && (
            <>
              <button onClick={() => setStep("login")} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 text-sm mb-8">
                <ChevronLeft className="w-4 h-4" /> Back to sign in
              </button>
              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-1">Forgot password?</h2>
                <p className="text-gray-500 text-sm">{"Enter your email and we'll send a reset link"}</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
                  <input type="email" placeholder="emeka.obi@gmail.com" className={inputCls} />
                </div>
                <LoadingBtn onClick={() => simulateLoading(() => setStep("otp"))} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  Send reset link
                </LoadingBtn>
              </div>
            </>
          )}

          {/* ── OTP Verification ── */}
          {step === "otp" && (
            <>
              <button onClick={() => setStep("login")} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 text-sm mb-8">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              <div className="mb-8">
                <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4">
                  <Smartphone className="w-7 h-7 text-indigo-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-1">Verify your phone</h2>
                <p className="text-gray-500 text-sm">
                  Enter the 6-digit code sent to{" "}
                  <span className="font-medium text-gray-900">+234 801 *** 5678</span>
                </p>
              </div>
              <div className="space-y-6">
                <div className="flex gap-2 justify-between">
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      id={`otp-${i}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleOtpChange(e.target.value, i, otp, setOtp)}
                      onKeyDown={e => {
                        if (e.key === "Backspace" && !otp[i] && i > 0) {
                          document.getElementById(`otp-${i - 1}`)?.focus();
                        }
                      }}
                      className="w-12 h-14 text-center text-xl font-semibold text-gray-900 rounded-xl border-2 border-gray-200 bg-white focus:outline-none focus:border-indigo-500 transition"
                    />
                  ))}
                </div>
                <LoadingBtn onClick={() => simulateLoading(() => setStep("create-pin"))} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  Verify OTP
                </LoadingBtn>
                <p className="text-center text-sm text-gray-500">
                  {"Didn't receive code? "}
                  <button className="text-indigo-600 font-medium">Resend in 0:45</button>
                </p>
              </div>
            </>
          )}

          {/* ── Create PIN ── */}
          {step === "create-pin" && (
            <>
              <div className="mb-8">
                <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4">
                  <Lock className="w-7 h-7 text-indigo-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-1">
                  {pinStep === "create" ? "Create transaction PIN" : "Confirm your PIN"}
                </h2>
                <p className="text-gray-500 text-sm">
                  {pinStep === "create"
                    ? "This 4-digit PIN secures all your transactions"
                    : "Re-enter your PIN to confirm"}
                </p>
              </div>
              <div className="space-y-6">
                <div className="flex gap-3 justify-center">
                  {(pinStep === "create" ? pin : confirmPin).map((digit, i) => (
                    <input
                      key={i}
                      id={`pin-${i}`}
                      type="password"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={e => {
                        const val = e.target.value.replace(/\D/, "");
                        const arr = pinStep === "create" ? [...pin] : [...confirmPin];
                        arr[i] = val.slice(-1);
                        pinStep === "create" ? setPin(arr) : setConfirmPin(arr);
                        if (val && i < 3) document.getElementById(`pin-${i + 1}`)?.focus();
                      }}
                      className="w-14 h-16 text-center text-2xl font-bold text-gray-900 rounded-xl border-2 border-gray-200 bg-white focus:outline-none focus:border-indigo-500 transition"
                    />
                  ))}
                </div>
                <LoadingBtn
                  onClick={() => {
                    if (pinStep === "create") {
                      setPinStep("confirm");
                    } else {
                      simulateLoading(onLogin);
                    }
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  {pinStep === "create" ? <>Continue <ArrowRight className="w-4 h-4" /></> : <>Confirm PIN <CheckCircle className="w-4 h-4" /></>}
                </LoadingBtn>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────
const userNavItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "services", label: "Services", icon: Zap },
  { id: "transactions", label: "Transactions", icon: Receipt },
  { id: "wallet", label: "Wallet", icon: Wallet },
  { id: "beneficiaries", label: "Beneficiaries", icon: Users },
  { id: "referral", label: "Referral", icon: Share2 },
  { id: "notifications", label: "Notifications", icon: Bell, badge: 3 },
  { id: "support", label: "Support", icon: HelpCircle },
];

const userBottomItems = [
  { id: "profile", label: "Profile", icon: User },
  { id: "settings", label: "Settings", icon: Settings },
];

const adminNavItems = [
  { id: "admin-dashboard", label: "Overview", icon: LayoutDashboard },
  { id: "admin-users", label: "Users", icon: Users },
  { id: "admin-transactions", label: "Transactions", icon: Receipt },
  { id: "admin-revenue", label: "Revenue", icon: TrendingUp },
  { id: "admin-support", label: "Support Tickets", icon: Inbox },
  { id: "admin-fraud", label: "Fraud Monitor", icon: Flag },
  { id: "admin-reports", label: "Reports", icon: FileText },
];

function Sidebar({
  page, setPage, open, onClose, isAdmin, setIsAdmin,
}: {
  page: Page; setPage: (p: Page) => void;
  open: boolean; onClose: () => void;
  isAdmin: boolean; setIsAdmin: (v: boolean) => void;
}) {
  const navItems = isAdmin ? adminNavItems : userNavItems;
  const bottomItems = isAdmin ? [] : userBottomItems;

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/40 z-20 lg:hidden" onClick={onClose} />}
      <aside className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-100 flex flex-col transition-transform duration-200 shrink-0 ${open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="h-16 flex items-center px-5 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-gray-900 tracking-tight">SwiftVTU</span>
          </div>
          {isAdmin && (
            <span className="ml-auto text-xs bg-amber-100 text-amber-700 font-medium px-2 py-0.5 rounded-full">Admin</span>
          )}
        </div>

        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <div className="space-y-0.5">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => setPage(item.id as Page)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  page === item.id
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
                {"badge" in item && (
                  <span className="ml-auto bg-indigo-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                    {String(item.badge)}
                  </span>
                )}
              </button>
            ))}
          </div>

          {bottomItems.length > 0 && (
            <div className="mt-5 pt-4 border-t border-gray-100 space-y-0.5">
              {bottomItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => setPage(item.id as Page)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    page === item.id
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          )}
        </nav>

        {/* Role switcher + user footer */}
        <div className="p-3 border-t border-gray-100 space-y-2">
          <div
            onClick={() => {
              setIsAdmin(!isAdmin);
              setPage(isAdmin ? "dashboard" : "admin-dashboard");
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-50 transition"
          >
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isAdmin ? "bg-amber-100" : "bg-gray-100"}`}>
              {isAdmin ? <User className="w-3.5 h-3.5 text-amber-700" /> : <Layers className="w-3.5 h-3.5 text-gray-500" />}
            </div>
            <span className="text-xs text-gray-500 font-medium">{isAdmin ? "Switch to User View" : "Switch to Admin"}</span>
          </div>
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 cursor-pointer group">
            <div className="w-8 h-8 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-xs font-semibold shrink-0">
              CO
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">Chukwuemeka Obi</p>
              <p className="text-xs text-gray-500 truncate">emeka.obi@gmail.com</p>
            </div>
            <LogOut className="w-4 h-4 text-gray-300 group-hover:text-gray-400 shrink-0" />
          </div>
        </div>
      </aside>
    </>
  );
}

// ─── Top Bar ──────────────────────────────────────────────────────────────────
const pageTitles: Record<string, string> = {
  dashboard: "Dashboard", services: "Services", transactions: "Transactions",
  wallet: "Wallet", notifications: "Notifications", profile: "Profile",
  settings: "Settings", support: "Support", referral: "Referral Program",
  beneficiaries: "Beneficiaries", receipt: "Transaction Receipt",
  "admin-dashboard": "Admin Overview", "admin-users": "Users",
  "admin-transactions": "Transactions", "admin-revenue": "Revenue",
  "admin-support": "Support Tickets", "admin-fraud": "Fraud Monitor",
  "admin-reports": "Reports",
};

function TopBar({ page, onToggleSidebar }: { page: Page; onToggleSidebar: () => void }) {
  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center px-5 gap-4 shrink-0">
      <button onClick={onToggleSidebar} className="lg:hidden p-2 -ml-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition">
        <Menu className="w-5 h-5" />
      </button>
      <h1 className="text-gray-900 font-semibold">{pageTitles[page] ?? "SwiftVTU"}</h1>
      <div className="ml-auto flex items-center gap-2">
        <button className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-600 rounded-full" />
        </button>
        <div className="w-8 h-8 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-xs font-semibold cursor-pointer hover:ring-2 hover:ring-indigo-200 transition">
          CO
        </div>
      </div>
    </header>
  );
}

// ─── Mobile Bottom Nav ────────────────────────────────────────────────────────
const mobileNavItems = [
  { id: "dashboard", icon: LayoutDashboard, label: "Home" },
  { id: "services", icon: Zap, label: "Services" },
  { id: "transactions", icon: Receipt, label: "History" },
  { id: "wallet", icon: Wallet, label: "Wallet" },
  { id: "profile", icon: User, label: "Profile" },
];

function MobileBottomNav({ page, setPage }: { page: Page; setPage: (p: Page) => void }) {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-gray-100 flex">
      {mobileNavItems.map(item => (
        <button
          key={item.id}
          onClick={() => setPage(item.id as Page)}
          className={`flex-1 flex flex-col items-center gap-0.5 py-3 text-xs font-medium transition-colors ${
            page === item.id ? "text-indigo-600" : "text-gray-400 hover:text-gray-600"
          }`}
        >
          <item.icon className="w-5 h-5" />
          {item.label}
        </button>
      ))}
    </nav>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function DashboardPage({ setPage }: { setPage: (p: Page) => void }) {
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(t);
  }, []);

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto space-y-5">
        <SkeletonLine className="h-4 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 h-44 bg-gray-100 rounded-2xl animate-pulse" />
          <div className="grid grid-rows-2 gap-4">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
        <SkeletonCard />
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-3 h-48 bg-gray-100 rounded-xl animate-pulse" />
          <div className="lg:col-span-2 h-48 bg-gray-100 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 pb-24 lg:pb-6 max-w-6xl mx-auto space-y-5">
      <div>
        <p className="text-gray-800 text-sm font-medium">
          Good afternoon, <span className="text-indigo-600">Chukwuemeka</span> 👋
        </p>
        <p className="text-gray-400 text-xs mt-0.5">Sunday, 29 June 2026</p>
      </div>

      {/* Balance + stat cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-indigo-700 rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5" />
          <div className="absolute -bottom-16 right-10 w-56 h-56 rounded-full bg-white/5" />
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className="text-indigo-300 text-xs font-medium uppercase tracking-wide mb-1">Total Balance</p>
                <div className="flex items-center gap-3">
                  <span className="text-white text-3xl font-semibold tracking-tight">
                    {balanceVisible ? fmt(mockUser.balance) : "₦ ••••••"}
                  </span>
                  <button onClick={() => setBalanceVisible(!balanceVisible)} className="text-indigo-300 hover:text-white transition">
                    {balanceVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="bg-white/10 text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" /> Active
              </div>
            </div>
            <div className="flex items-center gap-2 mb-5">
              <span className="text-indigo-300 text-sm font-mono">{mockUser.accountNumber}</span>
              <button className="text-indigo-400 hover:text-white transition"><Copy className="w-3.5 h-3.5" /></button>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setPage("wallet")} className="flex-1 bg-white text-indigo-700 font-medium text-sm py-2.5 rounded-xl hover:bg-indigo-50 transition flex items-center justify-center gap-1.5">
                <Plus className="w-4 h-4" /> Fund Wallet
              </button>
              <button onClick={() => setPage("services")} className="flex-1 bg-white/10 hover:bg-white/20 text-white font-medium text-sm py-2.5 rounded-xl transition flex items-center justify-center gap-1.5">
                <ArrowUpRight className="w-4 h-4" /> Send Money
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-rows-2 gap-4">
          {[
            { label: "Spent", amount: 23350, icon: ArrowUpRight, color: "bg-rose-50", icolor: "text-rose-500", trend: "+12%" },
            { label: "Received", amount: 35000, icon: ArrowDownLeft, color: "bg-emerald-50", icolor: "text-emerald-500", trend: "+8%" },
          ].map(item => (
            <div key={item.label} className="bg-white border border-gray-100 rounded-xl p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-400 text-xs font-medium uppercase tracking-wide">{item.label}</p>
                <div className={`w-7 h-7 ${item.color} rounded-lg flex items-center justify-center`}>
                  <item.icon className={`w-3.5 h-3.5 ${item.icolor}`} />
                </div>
              </div>
              <div>
                <p className="text-gray-900 text-xl font-semibold">{fmt(item.amount)}</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3 h-3 text-emerald-500" />
                  <span className="text-emerald-600 text-xs font-medium">{item.trend}</span>
                  <span className="text-gray-400 text-xs">this month</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white border border-gray-100 rounded-xl p-5">
        <h3 className="text-gray-900 font-semibold text-sm mb-4">Quick Actions</h3>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
          {services.map(s => (
            <button key={s.id} onClick={() => setPage("services")} className="flex flex-col items-center gap-2 group">
              <div className={`w-12 h-12 rounded-xl ${s.color} flex items-center justify-center group-hover:scale-105 transition-transform`}>
                <s.icon className="w-5 h-5" />
              </div>
              <span className="text-xs text-gray-600 text-center leading-tight">{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Chart + recent */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 bg-white border border-gray-100 rounded-xl p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-gray-900 font-semibold text-sm">Spending Overview</h3>
              <p className="text-gray-400 text-xs mt-0.5">Last 7 days</p>
            </div>
            <div className="flex gap-1">
              {["7D", "1M", "3M"].map(p => (
                <button key={p} className={`text-xs px-2.5 py-1 rounded-md font-medium transition ${p === "7D" ? "bg-indigo-50 text-indigo-700" : "text-gray-400 hover:text-gray-600"}`}>{p}</button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={155}>
            <AreaChart data={spendingData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} tickFormatter={v => `₦${v / 1000}k`} />
              <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #E5E7EB", borderRadius: "8px", fontSize: "12px" }} formatter={(v) => [fmt(chartValue(v)), "Spent"]} />
              <Area type="monotone" dataKey="amount" stroke="#4F46E5" strokeWidth={2} fill="url(#grad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="lg:col-span-2 bg-white border border-gray-100 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-900 font-semibold text-sm">Recent Activity</h3>
            <button onClick={() => setPage("transactions")} className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-0.5">
              View all <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-3">
            {transactions.slice(0, 5).map(tx => (
              <div key={tx.id} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${tx.amount > 0 ? "bg-emerald-50" : "bg-gray-100"}`}>
                  <tx.icon className={`w-4 h-4 ${tx.amount > 0 ? "text-emerald-600" : "text-gray-500"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-900 text-xs font-medium truncate">{tx.desc}</p>
                  <p className="text-gray-400 text-xs truncate">{tx.date}</p>
                </div>
                <span className={`text-xs font-semibold shrink-0 ${tx.amount > 0 ? "text-emerald-600" : "text-gray-900"}`}>
                  {tx.amount > 0 ? "+" : ""}{fmt(Math.abs(tx.amount))}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Services ─────────────────────────────────────────────────────────────────
function ServicesPage({ setPage }: { setPage: (p: Page) => void }) {
  const [activeService, setActiveService] = useState<string | null>(null);
  const [selectedNetwork, setSelectedNetwork] = useState("MTN");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState<"form" | "confirm" | "success">("form");
  const [loading, setLoading] = useState(false);

  const inputCls = "w-full px-3.5 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition";

  const openService = (id: string) => { setActiveService(id); setStep("form"); setPhone(""); setAmount(""); };
  const closeModal = () => { setActiveService(null); setStep("form"); };
  const isTelecom = activeService === "airtime" || activeService === "data";
  const currentService = services.find(s => s.id === activeService);

  const cats = [
    { label: "Telecom Services", ids: ["airtime", "data"] },
    { label: "Utility Payments", ids: ["cable", "electricity", "education"] },
    { label: "Finance & More", ids: ["giftcard", "transfer", "fund"] },
  ];

  return (
    <div className="p-6 pb-24 lg:pb-6 max-w-4xl mx-auto space-y-5">
      {cats.map(cat => (
        <div key={cat.label} className="bg-white border border-gray-100 rounded-xl p-5">
          <h3 className="text-gray-900 font-semibold text-sm mb-4">{cat.label}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {services.filter(s => cat.ids.includes(s.id)).map(s => (
              <button
                key={s.id}
                onClick={() => openService(s.id)}
                className="flex items-center gap-3 p-3.5 rounded-xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/20 transition group text-left"
              >
                <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
                  <s.icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-gray-900 text-sm font-medium">{s.label}</p>
                  <p className="text-gray-400 text-xs">{s.description}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 ml-auto shrink-0" />
              </button>
            ))}
          </div>
        </div>
      ))}

      {activeService && currentService && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl ${currentService.color} flex items-center justify-center`}>
                  <currentService.icon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">{currentService.label}</h3>
                  <p className="text-gray-400 text-xs">{currentService.description}</p>
                </div>
              </div>
              <button onClick={closeModal} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 transition">
                <X className="w-4 h-4" />
              </button>
            </div>

            {step === "form" && (
              <div className="p-5 space-y-4">
                {isTelecom && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">Select Network</label>
                    <div className="grid grid-cols-4 gap-2">
                      {["MTN", "Airtel", "Glo", "9mobile"].map(n => (
                        <button
                          key={n}
                          onClick={() => setSelectedNetwork(n)}
                          className={`py-2 text-xs font-medium rounded-lg border transition ${selectedNetwork === n ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {activeService === "electricity" && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Distribution Company</label>
                    <select className={inputCls}>
                      {["EKEDC — Eko", "IKEDC — Ikeja", "AEDC — Abuja", "PHEDC — Port Harcourt"].map(d => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    {isTelecom ? "Phone Number" : activeService === "electricity" ? "Meter Number" : "Account Number"}
                  </label>
                  <input
                    type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                    placeholder={isTelecom ? "08012345678" : "0101234567890"}
                    className={inputCls}
                  />
                </div>
                {activeService === "airtime" && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">Amount</label>
                    <div className="grid grid-cols-3 gap-2 mb-2.5">
                      {[100, 200, 500, 1000, 2000, 5000].map(a => (
                        <button key={a} onClick={() => setAmount(String(a))} className={`py-2 text-xs font-medium rounded-lg border transition ${amount === String(a) ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}>
                          {fmt(a)}
                        </button>
                      ))}
                    </div>
                    <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Custom amount" className={inputCls} />
                  </div>
                )}
                {["electricity", "cable", "data"].includes(activeService) && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Amount (₦)</label>
                    <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Enter amount" className={inputCls} />
                  </div>
                )}
                <div className="pt-1">
                  <div className="flex items-center justify-between text-xs text-gray-400 mb-4">
                    <span>Wallet balance</span>
                    <span className="font-semibold text-gray-900">{fmt(mockUser.balance)}</span>
                  </div>
                  <button
                    onClick={() => setStep("confirm")}
                    disabled={!phone}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg text-sm transition"
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}

            {step === "confirm" && (
              <div className="p-5">
                <div className="bg-gray-50 rounded-xl p-4 space-y-3 mb-5 text-sm">
                  {[
                    ["Service", currentService.label],
                    ...(isTelecom ? [["Network", selectedNetwork]] : []),
                    ["Recipient", phone || "N/A"],
                    ["Amount", fmt(Number(amount) || 500)],
                    ["Transaction Fee", "Free"],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between">
                      <span className="text-gray-500">{k}</span>
                      <span className={`font-medium ${k === "Transaction Fee" ? "text-emerald-600" : "text-gray-900"} ${k === "Recipient" ? "font-mono" : ""}`}>{v}</span>
                    </div>
                  ))}
                  <div className="border-t border-gray-200 pt-3 flex justify-between font-semibold">
                    <span className="text-gray-900">Total Debit</span>
                    <span className="text-gray-900">{fmt(Number(amount) || 500)}</span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setStep("form")} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 rounded-lg text-sm transition">Back</button>
                  <button onClick={() => { setLoading(true); setTimeout(() => { setLoading(false); setStep("success"); }, 1500); }} disabled={loading} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg text-sm transition flex items-center justify-center gap-2 disabled:opacity-70">
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Confirm Payment"}
                  </button>
                </div>
              </div>
            )}

            {step === "success" && (
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-emerald-500" />
                </div>
                <h3 className="text-gray-900 font-semibold mb-1">Payment Successful</h3>
                <p className="text-gray-500 text-sm mb-1">{currentService.label} of <span className="font-medium text-gray-900">{fmt(Number(amount) || 500)}</span></p>
                <p className="text-gray-500 text-sm mb-5">sent to <span className="font-mono font-medium text-gray-900">{phone}</span></p>
                <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-400 mb-5 font-mono">
                  Ref: VTU{Date.now().toString().slice(-8)}
                </div>
                <div className="flex gap-3">
                  <button onClick={() => { closeModal(); setPage("receipt"); }} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 rounded-lg text-sm transition flex items-center justify-center gap-1.5">
                    <Download className="w-4 h-4" /> Receipt
                  </button>
                  <button onClick={closeModal} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg text-sm transition">Done</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Transactions ─────────────────────────────────────────────────────────────
function TransactionsPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedTx, setSelectedTx] = useState<typeof transactions[0] | null>(null);

  const filtered = transactions.filter(tx => {
    const q = search.toLowerCase();
    return (tx.desc.toLowerCase().includes(q) || tx.detail.toLowerCase().includes(q) || tx.ref.toLowerCase().includes(q))
      && (filter === "all" || tx.status === filter);
  });

  return (
    <div className="p-6 pb-24 lg:pb-6 max-w-4xl mx-auto space-y-4">
      <div className="bg-white border border-gray-100 rounded-xl p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search transactions…" className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition" />
          </div>
          <div className="flex gap-1.5">
            {["all", "success", "pending", "failed"].map(f => (
              <button key={f} onClick={() => setFilter(f)} className={`text-xs px-3 py-1.5 rounded-lg font-medium transition capitalize ${filter === f ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>{f}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
          <p className="text-gray-500 text-xs">{filtered.length} transaction{filtered.length !== 1 ? "s" : ""}</p>
          <button className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"><Download className="w-3.5 h-3.5" /> Export</button>
        </div>
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <Receipt className="w-5 h-5 text-gray-300" />
            </div>
            <p className="text-gray-500 text-sm font-medium">No transactions found</p>
            <p className="text-gray-400 text-xs mt-1">Try adjusting your search or filter</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map(tx => (
              <div key={tx.id} onClick={() => setSelectedTx(tx)} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition cursor-pointer">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${tx.amount > 0 ? "bg-emerald-50" : "bg-gray-100"}`}>
                  <tx.icon className={`w-5 h-5 ${tx.amount > 0 ? "text-emerald-600" : "text-gray-500"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-gray-900 text-sm font-medium">{tx.desc}</p>
                    <StatusBadge status={tx.status} />
                  </div>
                  <p className="text-gray-400 text-xs mt-0.5">{tx.detail} · {tx.date}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-sm font-semibold ${tx.amount > 0 ? "text-emerald-600" : "text-gray-900"}`}>
                    {tx.amount > 0 ? "+" : ""}{fmt(Math.abs(tx.amount))}
                  </p>
                  <p className="text-gray-400 text-xs mt-0.5 font-mono">{tx.ref}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Transaction detail modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Transaction Details</h3>
              <button onClick={() => setSelectedTx(null)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5">
              <div className="flex flex-col items-center mb-5 pb-5 border-b border-gray-100">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 ${selectedTx.amount > 0 ? "bg-emerald-50" : "bg-gray-100"}`}>
                  <selectedTx.icon className={`w-7 h-7 ${selectedTx.amount > 0 ? "text-emerald-600" : "text-gray-500"}`} />
                </div>
                <p className={`text-2xl font-semibold ${selectedTx.amount > 0 ? "text-emerald-600" : "text-gray-900"}`}>
                  {selectedTx.amount > 0 ? "+" : ""}{fmt(Math.abs(selectedTx.amount))}
                </p>
                <p className="text-gray-500 text-sm mt-1">{selectedTx.desc}</p>
                <div className="mt-2"><StatusBadge status={selectedTx.status} /></div>
              </div>
              <div className="space-y-3 text-sm">
                {[
                  ["Reference", selectedTx.ref],
                  ["Recipient", selectedTx.detail],
                  ["Date & Time", selectedTx.date],
                  ["Transaction Fee", "Free"],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <span className="text-gray-500">{k}</span>
                    <span className="text-gray-900 font-medium text-right">{v}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setSelectedTx(null)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 rounded-lg text-sm transition flex items-center justify-center gap-1.5">
                  <Download className="w-4 h-4" /> Receipt
                </button>
                {selectedTx.status === "failed" && (
                  <button className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg text-sm transition flex items-center justify-center gap-1.5">
                    <RefreshCw className="w-4 h-4" /> Retry
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Receipt ──────────────────────────────────────────────────────────────────
function ReceiptPage() {
  const tx = transactions[0];
  return (
    <div className="p-6 pb-24 lg:pb-6 max-w-md mx-auto">
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        <div className="bg-indigo-700 p-6 text-center relative overflow-hidden">
          <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/5" />
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
          <p className="text-indigo-200 text-xs uppercase tracking-wide mb-1">Transaction Successful</p>
          <p className="text-white text-3xl font-semibold">{fmt(500)}</p>
          <p className="text-indigo-200 text-sm mt-1">{tx.desc}</p>
        </div>

        {/* Tear divider */}
        <div className="flex items-center">
          <div className="w-6 h-6 rounded-full bg-slate-50 -ml-3 shrink-0 border-r border-gray-100" />
          <div className="flex-1 border-t-2 border-dashed border-gray-100" />
          <div className="w-6 h-6 rounded-full bg-slate-50 -mr-3 shrink-0 border-l border-gray-100" />
        </div>

        <div className="p-6 space-y-4">
          {[
            ["Transaction ID", tx.ref],
            ["Service", tx.desc],
            ["Recipient", tx.detail],
            ["Network", tx.network || "N/A"],
            ["Date & Time", tx.date],
            ["Payment Method", "SwiftVTU Wallet"],
            ["Transaction Fee", "Free"],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between text-sm">
              <span className="text-gray-500">{k}</span>
              <span className="text-gray-900 font-medium font-mono text-right ml-4">{v}</span>
            </div>
          ))}
          <div className="border-t border-gray-100 pt-3 flex justify-between font-semibold">
            <span className="text-gray-900">Total Paid</span>
            <span className="text-gray-900">{fmt(500)}</span>
          </div>
        </div>

        <div className="px-6 pb-6 space-y-3">
          <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-xl text-sm transition flex items-center justify-center gap-2">
            <Download className="w-4 h-4" /> Download Receipt
          </button>
          <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 rounded-xl text-sm transition flex items-center justify-center gap-2">
            <Share2 className="w-4 h-4" /> Share Receipt
          </button>
          <div className="text-center">
            <p className="text-gray-400 text-xs">Powered by SwiftVTU · Ref: {tx.ref}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Wallet ───────────────────────────────────────────────────────────────────
function WalletPage() {
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  const copyText = (_text: string, key: string) => {
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="p-6 pb-24 lg:pb-6 max-w-3xl mx-auto space-y-4">
      <div className="bg-indigo-700 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5" />
        <div className="absolute -bottom-16 right-10 w-56 h-56 rounded-full bg-white/5" />
        <div className="relative z-10">
          <p className="text-indigo-300 text-xs font-medium uppercase tracking-wide mb-1">SwiftVTU Wallet</p>
          <div className="flex items-center gap-3 mb-1">
            <span className="text-white text-3xl font-semibold">{balanceVisible ? fmt(mockUser.balance) : "₦ ••••••"}</span>
            <button onClick={() => setBalanceVisible(!balanceVisible)} className="text-indigo-300 hover:text-white transition">
              {balanceVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-indigo-300 text-sm font-mono mb-6">{mockUser.accountNumber}</p>
          <div className="flex gap-3">
            <button className="flex-1 bg-white text-indigo-700 font-medium text-sm py-2.5 rounded-xl hover:bg-indigo-50 transition flex items-center justify-center gap-1.5">
              <Plus className="w-4 h-4" /> Fund Wallet
            </button>
            <button className="flex-1 bg-white/10 hover:bg-white/20 text-white font-medium text-sm py-2.5 rounded-xl transition flex items-center justify-center gap-1.5">
              <ArrowUpRight className="w-4 h-4" /> Transfer
            </button>
            <button className="w-12 bg-white/10 hover:bg-white/20 text-white font-medium text-sm py-2.5 rounded-xl transition flex items-center justify-center">
              <QrCode className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl p-5">
        <h3 className="text-gray-900 font-semibold text-sm mb-4">Fund Your Wallet</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { icon: Building2, label: "Bank Transfer", desc: "Transfer from any bank", color: "bg-blue-50 text-blue-600" },
            { icon: CreditCard, label: "Card Payment", desc: "Debit or credit card", color: "bg-indigo-50 text-indigo-600" },
            { icon: Smartphone, label: "USSD Code", desc: "Dial *738# to fund", color: "bg-purple-50 text-purple-600" },
          ].map(opt => (
            <button key={opt.label} className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/20 transition text-left">
              <div className={`w-10 h-10 rounded-xl ${opt.color} flex items-center justify-center shrink-0`}>
                <opt.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-gray-900 text-sm font-medium">{opt.label}</p>
                <p className="text-gray-400 text-xs">{opt.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl p-5">
        <h3 className="text-gray-900 font-semibold text-sm mb-4">Virtual Account Details</h3>
        <div className="bg-gray-50 rounded-xl p-4 space-y-3">
          {[
            ["Bank Name", "Providus Bank", "bank"],
            ["Account Name", "SwiftVTU / Chukwuemeka Obi", "name"],
            ["Account Number", "0123456789", "acc"],
          ].map(([label, value, key]) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-gray-500 text-sm">{label}</span>
              <div className="flex items-center gap-2">
                <span className="text-gray-900 text-sm font-medium font-mono">{value}</span>
                <button onClick={() => copyText(value, key)} className="text-gray-400 hover:text-gray-600 transition">
                  {copied === key ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          ))}
        </div>
        <p className="text-gray-400 text-xs mt-3">Transfers to this account are credited instantly, 24/7.</p>
      </div>
    </div>
  );
}

// ─── Beneficiaries ────────────────────────────────────────────────────────────
function BeneficiariesPage() {
  const [search, setSearch] = useState("");
  const filtered = beneficiaries.filter(b =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    (b.phone ?? "").includes(search)
  );

  return (
    <div className="p-6 pb-24 lg:pb-6 max-w-3xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search beneficiaries…" className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition" />
        </div>
        <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition shrink-0">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100">
          <p className="text-gray-500 text-xs">{filtered.length} saved recipient{filtered.length !== 1 ? "s" : ""}</p>
        </div>
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <Users className="w-5 h-5 text-gray-300" />
            </div>
            <p className="text-gray-500 text-sm font-medium">No beneficiaries found</p>
            <button className="mt-3 text-indigo-600 text-sm font-medium">Add your first beneficiary</button>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map(b => (
              <div key={b.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 ${b.color}`}>
                  {b.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-900 text-sm font-medium">{b.name}</p>
                  <p className="text-gray-400 text-xs mt-0.5">
                    {b.type === "bank" ? `${b.bank} · ${b.account}` : `${b.network} · ${b.phone}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    b.type === "bank" ? "bg-teal-50 text-teal-700" : "bg-indigo-50 text-indigo-700"
                  }`}>
                    {b.type === "bank" ? "Bank" : b.type === "airtime" ? "Airtime" : "Data"}
                  </span>
                  <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 transition">
                    <Send className="w-4 h-4" />
                  </button>
                  <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 transition">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Referral ─────────────────────────────────────────────────────────────────
function ReferralPage() {
  const [copied, setCopied] = useState(false);

  return (
    <div className="p-6 pb-24 lg:pb-6 max-w-2xl mx-auto space-y-4">
      {/* Hero */}
      <div className="bg-indigo-700 rounded-2xl p-6 relative overflow-hidden text-center">
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/5" />
        <div className="absolute -bottom-10 -left-6 w-40 h-40 rounded-full bg-white/5" />
        <div className="relative z-10">
          <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Gift className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-white text-xl font-semibold mb-2">Earn ₦500 per referral</h2>
          <p className="text-indigo-200 text-sm leading-relaxed mb-5">
            Share your referral code with friends. Earn ₦500 when they complete their first transaction.
          </p>
          <div className="bg-white/10 rounded-xl p-4 flex items-center justify-between gap-3">
            <div className="text-left">
              <p className="text-indigo-300 text-xs mb-1">Your referral code</p>
              <p className="text-white font-mono font-bold text-lg tracking-widest">{mockUser.referralCode}</p>
            </div>
            <button
              onClick={() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }}
              className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1.5"
            >
              {copied ? <><CheckCircle className="w-3.5 h-3.5" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Referrals", value: mockUser.referralCount, icon: Users, color: "bg-blue-50 text-blue-600" },
          { label: "Earnings", value: fmt(mockUser.referralEarnings), icon: DollarSign, color: "bg-emerald-50 text-emerald-600" },
          { label: "Pending", value: 2, icon: Clock, color: "bg-amber-50 text-amber-600" },
        ].map(item => (
          <div key={item.label} className="bg-white border border-gray-100 rounded-xl p-4 text-center">
            <div className={`w-9 h-9 rounded-xl ${item.color} flex items-center justify-center mx-auto mb-2`}>
              <item.icon className="w-4 h-4" />
            </div>
            <p className="text-gray-900 font-semibold text-lg">{item.value}</p>
            <p className="text-gray-400 text-xs mt-0.5">{item.label}</p>
          </div>
        ))}
      </div>

      {/* How it works */}
      <div className="bg-white border border-gray-100 rounded-xl p-5">
        <h3 className="text-gray-900 font-semibold text-sm mb-4">How it works</h3>
        <div className="space-y-4">
          {[
            { step: "1", title: "Share your code", desc: "Share your unique referral code or link with friends and family" },
            { step: "2", title: "Friend signs up", desc: "Your friend creates a SwiftVTU account using your referral code" },
            { step: "3", title: "Earn your reward", desc: "Get ₦500 credited to your wallet once they complete a transaction" },
          ].map(item => (
            <div key={item.step} className="flex gap-4">
              <div className="w-8 h-8 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">
                {item.step}
              </div>
              <div>
                <p className="text-gray-900 text-sm font-medium">{item.title}</p>
                <p className="text-gray-400 text-xs mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Share */}
      <div className="bg-white border border-gray-100 rounded-xl p-5">
        <h3 className="text-gray-900 font-semibold text-sm mb-3">Share via</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "WhatsApp", color: "bg-green-50 text-green-700 border-green-100" },
            { label: "Copy Link", color: "bg-indigo-50 text-indigo-700 border-indigo-100" },
            { label: "Twitter / X", color: "bg-gray-50 text-gray-700 border-gray-100" },
            { label: "SMS", color: "bg-blue-50 text-blue-700 border-blue-100" },
          ].map(opt => (
            <button key={opt.label} className={`py-2.5 rounded-lg text-sm font-medium border transition hover:opacity-80 ${opt.color}`}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Notifications ────────────────────────────────────────────────────────────
function NotificationsPage() {
  const notifs = [
    { id: 1, title: "Transaction Successful", body: "Your MTN Airtime purchase of ₦500 to 08012345678 was successful.", time: "2 minutes ago", read: false, type: "success" },
    { id: 2, title: "Low Balance Alert", body: "Your wallet balance has dropped below ₦5,000. Fund your wallet to continue.", time: "1 hour ago", read: false, type: "warning" },
    { id: 3, title: "Transaction Failed", body: "Your bank transfer of ₦10,000 to First Bank — John Doe could not be processed.", time: "2 days ago", read: true, type: "error" },
    { id: 4, title: "Wallet Funded", body: "₦20,000 has been credited to your wallet via bank transfer from Access Bank.", time: "3 days ago", read: true, type: "success" },
    { id: 5, title: "Referral Bonus", body: "You earned a ₦500 referral bonus! Adaeze Nwosu just completed her first transaction.", time: "5 days ago", read: true, type: "info" },
  ];
  const typeStyles: Record<string, string> = { success: "bg-emerald-50", warning: "bg-amber-50", error: "bg-red-50", info: "bg-blue-50" };
  const typeIcons: Record<string, ReactElement> = {
    success: <CheckCircle className="w-4 h-4 text-emerald-500" />,
    warning: <AlertCircle className="w-4 h-4 text-amber-500" />,
    error: <XCircle className="w-4 h-4 text-red-500" />,
    info: <Bell className="w-4 h-4 text-blue-500" />,
  };
  return (
    <div className="p-6 pb-24 lg:pb-6 max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-gray-500 text-sm">{notifs.filter(n => !n.read).length} unread</p>
        <button className="text-indigo-600 text-sm font-medium hover:text-indigo-700">Mark all as read</button>
      </div>
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden divide-y divide-gray-50">
        {notifs.map(n => (
          <div key={n.id} className={`flex gap-4 p-4 hover:bg-gray-50 transition cursor-pointer ${!n.read ? "bg-indigo-50/30" : ""}`}>
            <div className={`w-9 h-9 rounded-full ${typeStyles[n.type]} flex items-center justify-center shrink-0 mt-0.5`}>{typeIcons[n.type]}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-gray-900 text-sm font-medium">{n.title}</p>
                {!n.read && <span className="w-2 h-2 bg-indigo-600 rounded-full shrink-0" />}
              </div>
              <p className="text-gray-500 text-xs leading-relaxed">{n.body}</p>
              <p className="text-gray-400 text-xs mt-1.5">{n.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Profile ──────────────────────────────────────────────────────────────────
function ProfilePage() {
  return (
    <div className="p-6 pb-24 lg:pb-6 max-w-2xl mx-auto space-y-4">
      <div className="bg-white border border-gray-100 rounded-xl p-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-xl font-semibold shrink-0">CO</div>
          <div className="flex-1 min-w-0">
            <h2 className="text-gray-900 font-semibold">{mockUser.name}</h2>
            <p className="text-gray-500 text-sm">{mockUser.email}</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <StatusBadge status="verified" />
              <span className="text-gray-400 text-xs">Member since {mockUser.joinedDate}</span>
            </div>
          </div>
          <button className="text-sm text-indigo-600 font-medium border border-indigo-200 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition shrink-0">Edit</button>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl p-5">
        <h3 className="text-gray-900 font-semibold text-sm mb-1">Personal Information</h3>
        <p className="text-gray-400 text-xs mb-4">Your personal details as registered</p>
        <div className="divide-y divide-gray-50">
          {[
            ["Full Name", mockUser.name],
            ["Email Address", mockUser.email],
            ["Phone Number", mockUser.phone],
            ["Date of Birth", "15 March 1992"],
            ["Address", "12 Adeola Odeku, Victoria Island, Lagos"],
          ].map(([k, v]) => (
            <div key={k} className="flex items-start justify-between py-3">
              <span className="text-gray-500 text-sm w-36 shrink-0">{k}</span>
              <span className="text-gray-900 text-sm text-right">{v}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-gray-900 font-semibold text-sm">KYC Verification</h3>
            <p className="text-gray-400 text-xs mt-0.5">Identity verification status</p>
          </div>
          <StatusBadge status="verified" />
        </div>
        <div className="space-y-3">
          {[
            { label: "BVN Verification", done: true },
            { label: "Government-issued ID", done: true },
            { label: "Selfie Verification", done: true },
            { label: "Address Verification", done: false },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${item.done ? "bg-emerald-100" : "bg-gray-100"}`}>
                {item.done ? <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> : <Clock className="w-3.5 h-3.5 text-gray-400" />}
              </div>
              <span className={`text-sm ${item.done ? "text-gray-900" : "text-gray-400"}`}>{item.label}</span>
              {!item.done && <button className="ml-auto text-xs text-indigo-600 font-medium border border-indigo-200 px-2.5 py-1 rounded-lg hover:bg-indigo-50 transition">Complete</button>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Settings ─────────────────────────────────────────────────────────────────
function SettingsPage() {
  const [twoFA, setTwoFA] = useState(true);
  const [txPin, setTxPin] = useState(true);
  const [biometric, setBiometric] = useState(false);
  const [pushNotifs, setPushNotifs] = useState(true);
  const [emailNotifs, setEmailNotifs] = useState(false);
  const [smsNotifs, setSmsNotifs] = useState(true);

  return (
    <div className="p-6 pb-24 lg:pb-6 max-w-2xl mx-auto space-y-4">
      <div className="bg-white border border-gray-100 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-4 h-4 text-indigo-600" />
          <h3 className="text-gray-900 font-semibold text-sm">Security</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {[
            { label: "Two-Factor Authentication", desc: "Require OTP for all sign-ins", value: twoFA, onChange: setTwoFA },
            { label: "Transaction PIN", desc: "Require PIN for all transactions", value: txPin, onChange: setTxPin },
            { label: "Biometric Login", desc: "Use fingerprint or Face ID", value: biometric, onChange: setBiometric },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between py-3.5">
              <div>
                <p className="text-gray-900 text-sm font-medium">{item.label}</p>
                <p className="text-gray-400 text-xs mt-0.5">{item.desc}</p>
              </div>
              <Toggle value={item.value} onChange={item.onChange} />
            </div>
          ))}
          <div className="flex items-center justify-between py-3.5">
            <div>
              <p className="text-gray-900 text-sm font-medium">Change Password</p>
              <p className="text-gray-400 text-xs mt-0.5">Last updated 3 months ago</p>
            </div>
            <button className="text-xs text-indigo-600 font-medium border border-indigo-200 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition">Update</button>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-4 h-4 text-indigo-600" />
          <h3 className="text-gray-900 font-semibold text-sm">Notifications</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {[
            { label: "Push Notifications", desc: "In-app alerts for transactions", value: pushNotifs, onChange: setPushNotifs },
            { label: "Email Notifications", desc: "Receipts and account updates", value: emailNotifs, onChange: setEmailNotifs },
            { label: "SMS Alerts", desc: "Transaction confirmations via SMS", value: smsNotifs, onChange: setSmsNotifs },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between py-3.5">
              <div>
                <p className="text-gray-900 text-sm font-medium">{item.label}</p>
                <p className="text-gray-400 text-xs mt-0.5">{item.desc}</p>
              </div>
              <Toggle value={item.value} onChange={item.onChange} />
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Database className="w-4 h-4 text-indigo-600" />
          <h3 className="text-gray-900 font-semibold text-sm">Account</h3>
        </div>
        <div className="space-y-2">
          {[
            { label: "Linked Bank Accounts", desc: "3 accounts connected" },
            { label: "Saved Beneficiaries", desc: "6 saved recipients" },
            { label: "API Access", desc: "Developer integrations" },
            { label: "Business Profile", desc: "Upgrade to business account" },
          ].map(item => (
            <button key={item.label} className="w-full flex items-center justify-between p-3.5 rounded-xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition text-left">
              <div>
                <p className="text-gray-900 text-sm font-medium">{item.label}</p>
                <p className="text-gray-400 text-xs mt-0.5">{item.desc}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-red-100 rounded-xl p-5">
        <h3 className="text-red-600 font-semibold text-sm mb-3">Danger Zone</h3>
        <button className="w-full flex items-center justify-between p-3.5 rounded-xl border border-red-100 hover:bg-red-50 transition text-left">
          <div>
            <p className="text-red-700 text-sm font-medium">Deactivate Account</p>
            <p className="text-red-400 text-xs mt-0.5">Temporarily disable your account</p>
          </div>
          <ChevronRight className="w-4 h-4 text-red-300 shrink-0" />
        </button>
      </div>
    </div>
  );
}

// ─── Support ──────────────────────────────────────────────────────────────────
function SupportPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [ticketOpen, setTicketOpen] = useState(false);

  const faqs = [
    { q: "How do I fund my wallet?", a: "Fund via bank transfer, card payment, or USSD. Navigate to Wallet > Fund Wallet and choose your preferred method. Bank transfers reflect instantly." },
    { q: "Why did my transaction fail?", a: "Transactions fail due to insufficient balance, incorrect recipient details, or a temporary service disruption. Check your transaction history for the specific error and contact support if needed." },
    { q: "How long does airtime delivery take?", a: "Airtime is delivered within seconds in most cases. If it has not arrived within 2 minutes, open a support ticket and our team will resolve it promptly." },
    { q: "How do I reset my transaction PIN?", a: "Go to Settings > Security > Transaction PIN and tap \"Update\". You will be asked to verify your identity via OTP before setting a new PIN." },
    { q: "Is my money safe on SwiftVTU?", a: "Yes. SwiftVTU uses bank-grade 256-bit encryption and is registered with the CBN. Your wallet balance is fully protected." },
  ];

  return (
    <div className="p-6 pb-24 lg:pb-6 max-w-2xl mx-auto space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: HelpCircle, label: "Live Chat", desc: "Chat with a support agent now", color: "bg-indigo-50 text-indigo-600", action: () => {} },
          { icon: Receipt, label: "Open Ticket", desc: "Submit a complaint or request", color: "bg-purple-50 text-purple-600", action: () => setTicketOpen(true) },
        ].map(opt => (
          <button key={opt.label} onClick={opt.action} className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-3 hover:border-indigo-200 hover:bg-indigo-50/20 transition text-left">
            <div className={`w-10 h-10 rounded-xl ${opt.color} flex items-center justify-center shrink-0`}>
              <opt.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-gray-900 text-sm font-medium">{opt.label}</p>
              <p className="text-gray-400 text-xs">{opt.desc}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-gray-900 font-semibold text-sm">Frequently Asked Questions</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {faqs.map((faq, i) => (
            <div key={i}>
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition">
                <span className="text-gray-900 text-sm font-medium pr-4">{faq.q}</span>
                <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
              </button>
              {openFaq === i && (
                <div className="px-5 pb-4">
                  <p className="text-gray-500 text-sm leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex items-center gap-4">
        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center shrink-0">
          <Shield className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <p className="text-indigo-900 text-sm font-medium">Need urgent help?</p>
          <p className="text-indigo-600 text-xs mt-0.5">Email <span className="font-medium">support@swiftvtu.com</span> or call <span className="font-medium">0800-SWIFTVTU</span></p>
        </div>
      </div>

      {/* Ticket modal */}
      {ticketOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Open Support Ticket</h3>
              <button onClick={() => setTicketOpen(false)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Issue Category</label>
                <select className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition">
                  {["Transaction Issue", "Wallet Funding", "Account Access", "KYC Verification", "Other"].map(opt => <option key={opt}>{opt}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Transaction Reference <span className="text-gray-400">(if applicable)</span></label>
                <input type="text" placeholder="e.g. VTU20240629001" className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Describe the issue</label>
                <textarea rows={4} placeholder="Please describe your issue in detail…" className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition resize-none" />
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={() => setTicketOpen(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 rounded-lg text-sm transition">Cancel</button>
                <button onClick={() => setTicketOpen(false)} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg text-sm transition">Submit Ticket</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN SCREENS
// ═══════════════════════════════════════════════════════════════════════════════

function AdminStatCard({ label, value, sub, icon: Icon, color, trend }: {
  label: string; value: string; sub?: string; icon: React.ElementType; color: string; trend?: string;
}) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">{label}</p>
        <div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-gray-900 text-2xl font-semibold">{value}</p>
      {sub && <p className="text-gray-400 text-xs mt-1">{sub}</p>}
      {trend && (
        <div className="flex items-center gap-1 mt-2">
          <TrendingUp className="w-3 h-3 text-emerald-500" />
          <span className="text-emerald-600 text-xs font-medium">{trend}</span>
          <span className="text-gray-400 text-xs">vs last month</span>
        </div>
      )}
    </div>
  );
}

function AdminDashboardPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatCard label="Total Revenue" value="₦8.4M" sub="June 2026" icon={TrendingUp} color="bg-indigo-50 text-indigo-600" trend="+18%" />
        <AdminStatCard label="Transactions" value="36,840" sub="This month" icon={Activity} color="bg-blue-50 text-blue-600" trend="+24%" />
        <AdminStatCard label="Active Users" value="51,204" sub="+1,240 this week" icon={Users} color="bg-emerald-50 text-emerald-600" trend="+12%" />
        <AdminStatCard label="Success Rate" value="98.4%" sub="All transactions" icon={Percent} color="bg-amber-50 text-amber-600" trend="+0.3%" />
      </div>

      {/* Revenue chart */}
      <div className="bg-white border border-gray-100 rounded-xl p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-gray-900 font-semibold text-sm">Revenue Overview</h3>
            <p className="text-gray-400 text-xs mt-0.5">January — June 2026</p>
          </div>
          <select className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-700 focus:outline-none">
            <option>Monthly</option>
            <option>Weekly</option>
          </select>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={adminRevenueData} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} tickFormatter={v => `₦${v / 1000000}M`} />
            <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #E5E7EB", borderRadius: "8px", fontSize: "12px" }} formatter={(v) => [fmtCompact(chartValue(v)), "Revenue"]} />
            <Bar dataKey="revenue" fill="#4F46E5" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Service breakdown + recent transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <h3 className="text-gray-900 font-semibold text-sm mb-4">Service Breakdown</h3>
          <div className="flex justify-center mb-4">
            <PieChart width={140} height={140}>
              <Pie data={serviceBreakdown} dataKey="value" cx="50%" cy="50%" innerRadius={40} outerRadius={65} strokeWidth={0}>
                {serviceBreakdown.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
            </PieChart>
          </div>
          <div className="space-y-2">
            {serviceBreakdown.map(item => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-gray-600 text-xs">{item.name}</span>
                </div>
                <span className="text-gray-900 text-xs font-medium">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white border border-gray-100 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-900 font-semibold text-sm">Recent Transactions</h3>
            <span className="text-xs text-gray-400">Platform-wide</span>
          </div>
          <div className="space-y-3">
            {transactions.slice(0, 6).map(tx => (
              <div key={tx.id} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${tx.amount > 0 ? "bg-emerald-50" : "bg-gray-100"}`}>
                  <tx.icon className={`w-4 h-4 ${tx.amount > 0 ? "text-emerald-600" : "text-gray-500"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-900 text-xs font-medium truncate">{tx.desc} — {tx.detail}</p>
                  <p className="text-gray-400 text-xs">{tx.date}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs font-semibold ${tx.amount > 0 ? "text-emerald-600" : "text-gray-900"}`}>
                    {tx.amount > 0 ? "+" : ""}{fmt(Math.abs(tx.amount))}
                  </span>
                  <StatusBadge status={tx.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const filtered = adminUsers.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users by name or email…" className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition" />
        </div>
        <div className="flex gap-1.5">
          {["All", "Active", "Suspended"].map(f => (
            <button key={f} className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${f === "All" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>{f}</button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">User</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Balance</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Transactions</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">KYC</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Status</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Joined</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(u => (
                <tr key={u.id} className="hover:bg-gray-50 transition">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-xs font-semibold shrink-0">
                        {u.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                      </div>
                      <div>
                        <p className="text-gray-900 text-sm font-medium">{u.name}</p>
                        <p className="text-gray-400 text-xs">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-gray-900 text-sm font-medium">{fmt(u.balance)}</td>
                  <td className="px-5 py-4 text-gray-600 text-sm">{u.transactions}</td>
                  <td className="px-5 py-4"><StatusBadge status={u.kyc} /></td>
                  <td className="px-5 py-4"><StatusBadge status={u.status} /></td>
                  <td className="px-5 py-4 text-gray-400 text-xs">{u.joined}</td>
                  <td className="px-5 py-4">
                    <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AdminTransactionsPage() {
  const [filter, setFilter] = useState("all");
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Today", value: "1,284", icon: Activity, color: "bg-indigo-50 text-indigo-600" },
          { label: "Successful", value: "1,261", icon: CheckCircle, color: "bg-emerald-50 text-emerald-600" },
          { label: "Failed", value: "16", icon: XCircle, color: "bg-red-50 text-red-500" },
          { label: "Pending", value: "7", icon: Clock, color: "bg-amber-50 text-amber-600" },
        ].map(item => (
          <div key={item.label} className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${item.color} flex items-center justify-center shrink-0`}>
              <item.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-gray-900 font-semibold text-lg">{item.value}</p>
              <p className="text-gray-400 text-xs">{item.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input placeholder="Search by ref, user, or amount…" className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition" />
          </div>
          <div className="flex gap-1.5">
            {["all", "success", "failed", "pending"].map(f => (
              <button key={f} onClick={() => setFilter(f)} className={`text-xs px-3 py-1.5 rounded-lg font-medium transition capitalize ${filter === f ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>{f}</button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                {["Reference", "User", "Service", "Amount", "Status", "Date", ""].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {transactions.filter(t => filter === "all" || t.status === filter).map(tx => (
                <tr key={tx.id} className="hover:bg-gray-50 transition">
                  <td className="px-5 py-3.5 text-xs font-mono text-gray-500">{tx.ref}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-900">Chukwuemeka Obi</td>
                  <td className="px-5 py-3.5 text-sm text-gray-600">{tx.desc}</td>
                  <td className={`px-5 py-3.5 text-sm font-semibold ${tx.amount > 0 ? "text-emerald-600" : "text-gray-900"}`}>
                    {tx.amount > 0 ? "+" : ""}{fmt(Math.abs(tx.amount))}
                  </td>
                  <td className="px-5 py-3.5"><StatusBadge status={tx.status} /></td>
                  <td className="px-5 py-3.5 text-xs text-gray-400">{tx.date}</td>
                  <td className="px-5 py-3.5">
                    <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition"><MoreHorizontal className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AdminRevenuePage() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Revenue", value: "₦38.4M", sub: "Year to date", icon: DollarSign, color: "bg-indigo-50 text-indigo-600" },
          { label: "This Month", value: "₦8.4M", sub: "+18% vs May", icon: TrendingUp, color: "bg-emerald-50 text-emerald-600" },
          { label: "Avg Per Transaction", value: "₦228", sub: "Platform average", icon: BarChart2, color: "bg-blue-50 text-blue-600" },
          { label: "Gross Margin", value: "14.2%", sub: "After provider costs", icon: Percent, color: "bg-amber-50 text-amber-600" },
        ].map(item => (
          <div key={item.label} className="bg-white border border-gray-100 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-gray-400 text-xs font-medium uppercase tracking-wide">{item.label}</p>
              <div className={`w-8 h-8 rounded-lg ${item.color} flex items-center justify-center`}>
                <item.icon className="w-4 h-4" />
              </div>
            </div>
            <p className="text-gray-900 text-xl font-semibold">{item.value}</p>
            <p className="text-gray-400 text-xs mt-1">{item.sub}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-gray-100 rounded-xl p-5">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-gray-900 font-semibold text-sm">Monthly Revenue & Transaction Volume</h3>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={adminRevenueData} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.1} />
                <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} tickFormatter={v => `₦${v / 1000000}M`} />
            <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #E5E7EB", borderRadius: "8px", fontSize: "12px" }} formatter={(v) => [fmtCompact(chartValue(v)), "Revenue"]} />
            <Area type="monotone" dataKey="revenue" stroke="#4F46E5" strokeWidth={2} fill="url(#revGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function AdminSupportPage() {
  const tickets = [
    { id: "TKT001", user: "Adaeze Nwosu", subject: "Airtime not received after payment", status: "open", priority: "high", time: "5 min ago" },
    { id: "TKT002", user: "Kunle Adeleke", subject: "Unable to fund wallet with GTBank", status: "in-progress", priority: "medium", time: "1 hour ago" },
    { id: "TKT003", user: "Fatima Bello", subject: "KYC document rejected — reasons unclear", status: "open", priority: "low", time: "3 hours ago" },
    { id: "TKT004", user: "Tunde Bakare", subject: "Account suspended without notification", status: "resolved", priority: "high", time: "1 day ago" },
    { id: "TKT005", user: "Ngozi Okafor", subject: "Duplicate transaction charged twice", status: "in-progress", priority: "high", time: "2 days ago" },
  ];

  const priorityStyles: Record<string, string> = {
    high: "bg-red-50 text-red-700",
    medium: "bg-amber-50 text-amber-700",
    low: "bg-gray-100 text-gray-600",
  };
  const ticketStatusStyles: Record<string, string> = {
    open: "bg-blue-50 text-blue-700",
    "in-progress": "bg-amber-50 text-amber-700",
    resolved: "bg-emerald-50 text-emerald-700",
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-4">
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Open Tickets", value: "28", color: "bg-blue-50 text-blue-600" },
          { label: "In Progress", value: "12", color: "bg-amber-50 text-amber-600" },
          { label: "Resolved Today", value: "47", color: "bg-emerald-50 text-emerald-600" },
        ].map(item => (
          <div key={item.label} className="bg-white border border-gray-100 rounded-xl p-4 text-center">
            <p className={`text-2xl font-semibold mb-1 ${item.color.split(" ")[1]}`}>{item.value}</p>
            <p className="text-gray-500 text-xs">{item.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-gray-900 font-semibold text-sm">Support Tickets</h3>
          <div className="flex gap-1.5">
            {["All", "Open", "In Progress", "Resolved"].map(f => (
              <button key={f} className={`text-xs px-2.5 py-1 rounded-lg font-medium transition ${f === "All" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>{f}</button>
            ))}
          </div>
        </div>
        <div className="divide-y divide-gray-50">
          {tickets.map(ticket => (
            <div key={ticket.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition cursor-pointer">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <p className="text-gray-900 text-sm font-medium">{ticket.subject}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityStyles[ticket.priority]}`}>
                    {ticket.priority}
                  </span>
                </div>
                <p className="text-gray-400 text-xs">{ticket.user} · {ticket.id} · {ticket.time}</p>
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize shrink-0 ${ticketStatusStyles[ticket.status]}`}>
                {ticket.status.replace("-", " ")}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AdminFraudPage() {
  const alerts = [
    { id: "FRD001", user: "Unknown — 197.210.x.x", event: "Multiple failed login attempts (12x in 5 min)", severity: "critical", time: "2 min ago" },
    { id: "FRD002", user: "Kunle Adeleke", event: "Unusual transaction pattern: 45 airtime purchases in 1 hour", severity: "high", time: "15 min ago" },
    { id: "FRD003", user: "New Account — USR089", event: "First transaction of ₦500,000 bank transfer within 10 min of signup", severity: "high", time: "1 hour ago" },
    { id: "FRD004", user: "Fatima Bello", event: "Account accessed from 3 different countries in 2 hours", severity: "medium", time: "3 hours ago" },
    { id: "FRD005", user: "Tunde Bakare", event: "Repeated duplicate transaction attempts", severity: "medium", time: "6 hours ago" },
  ];
  const sevStyles: Record<string, string> = {
    critical: "bg-red-100 text-red-700",
    high: "bg-orange-100 text-orange-700",
    medium: "bg-amber-100 text-amber-700",
    low: "bg-gray-100 text-gray-600",
  };
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-4">
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
        <Flag className="w-5 h-5 text-red-600 shrink-0" />
        <div>
          <p className="text-red-900 text-sm font-medium">2 Critical Alerts Require Immediate Attention</p>
          <p className="text-red-500 text-xs mt-0.5">Review and take action on flagged accounts</p>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-gray-900 font-semibold text-sm">Fraud Alerts</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {alerts.map(alert => (
            <div key={alert.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <p className="text-gray-900 text-sm font-medium">{alert.event}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sevStyles[alert.severity]}`}>{alert.severity}</span>
                </div>
                <p className="text-gray-400 text-xs">{alert.user} · {alert.time}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg font-medium transition">Dismiss</button>
                <button className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg font-medium transition">Block</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AdminReportsPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[
          { icon: FileText, label: "Transaction Report", desc: "Full transaction export with filters", color: "bg-indigo-50 text-indigo-600" },
          { icon: Users, label: "User Report", desc: "User demographics and activity", color: "bg-blue-50 text-blue-600" },
          { icon: TrendingUp, label: "Revenue Report", desc: "Earnings, fees, and margins", color: "bg-emerald-50 text-emerald-600" },
          { icon: Flag, label: "Fraud Report", desc: "Security incidents and resolutions", color: "bg-red-50 text-red-500" },
          { icon: Activity, label: "Service Report", desc: "Performance by service type", color: "bg-purple-50 text-purple-600" },
          { icon: Globe, label: "Platform Report", desc: "Overall platform health metrics", color: "bg-amber-50 text-amber-600" },
        ].map(item => (
          <button key={item.label} className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-4 hover:border-indigo-200 hover:bg-indigo-50/20 transition text-left">
            <div className={`w-12 h-12 rounded-xl ${item.color} flex items-center justify-center shrink-0`}>
              <item.icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-gray-900 text-sm font-semibold">{item.label}</p>
              <p className="text-gray-400 text-xs mt-0.5">{item.desc}</p>
            </div>
            <Download className="w-4 h-4 text-gray-300 shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [authed, setAuthed] = useState(false);
  const [page, setPage] = useState<Page>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  if (!authed) return <AuthScreen onLogin={() => setAuthed(true)} />;

  return (
    <div className="flex h-screen overflow-hidden font-['Inter',sans-serif]" style={{ background: "#F9FAFB" }}>
      <Sidebar
        page={page}
        setPage={p => { setPage(p); setSidebarOpen(false); }}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isAdmin={isAdmin}
        setIsAdmin={v => { setIsAdmin(v); }}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar page={page} onToggleSidebar={() => setSidebarOpen(o => !o)} />
        <main className="flex-1 overflow-y-auto">
          {/* User pages */}
          {page === "dashboard" && <DashboardPage setPage={setPage} />}
          {page === "services" && <ServicesPage setPage={setPage} />}
          {page === "transactions" && <TransactionsPage />}
          {page === "receipt" && <ReceiptPage />}
          {page === "wallet" && <WalletPage />}
          {page === "beneficiaries" && <BeneficiariesPage />}
          {page === "referral" && <ReferralPage />}
          {page === "notifications" && <NotificationsPage />}
          {page === "profile" && <ProfilePage />}
          {page === "settings" && <SettingsPage />}
          {page === "support" && <SupportPage />}
          {/* Admin pages */}
          {page === "admin-dashboard" && <AdminDashboardPage />}
          {page === "admin-users" && <AdminUsersPage />}
          {page === "admin-transactions" && <AdminTransactionsPage />}
          {page === "admin-revenue" && <AdminRevenuePage />}
          {page === "admin-support" && <AdminSupportPage />}
          {page === "admin-fraud" && <AdminFraudPage />}
          {page === "admin-reports" && <AdminReportsPage />}
        </main>
      </div>

      {/* Mobile bottom nav — only for user mode */}
      {!isAdmin && <MobileBottomNav page={page} setPage={setPage} />}
    </div>
  );
}
