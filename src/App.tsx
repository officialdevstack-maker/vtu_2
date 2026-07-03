import { Link } from 'react-router-dom';
import {
  Phone, Wifi, Tv, Zap, ShieldCheck, ArrowRight, Clock, Users,
  UserPlus, Wallet, Send, PercentCircle, Timer, Receipt,
} from 'lucide-react';

const services = [
  { icon: Phone, label: 'Airtime top-up', description: 'MTN, Airtel, Glo and 9mobile, delivered instantly.' },
  { icon: Wifi, label: 'Data bundles', description: 'SME and gifting data plans at competitive rates.' },
  { icon: Tv, label: 'Cable TV', description: 'Renew DStv, GOtv and Startimes subscriptions.' },
  { icon: Zap, label: 'Electricity', description: 'Prepaid and postpaid tokens for every disco.' },
];

const trustPoints = [
  { icon: ShieldCheck, title: 'Secure by design', description: 'Bank-level encryption and dedicated virtual accounts for every wallet.' },
  { icon: Clock, title: 'Instant delivery', description: 'Transactions are processed automatically, with most completing in seconds.' },
  { icon: Users, title: 'Built for Nigeria', description: 'Local payment rails, all four networks, and every major disco supported.' },
];

const steps = [
  { icon: UserPlus, title: 'Create an account', description: 'Sign up with your email or phone number in under a minute.' },
  { icon: Wallet, title: 'Fund your wallet', description: 'Transfer from any bank, pay by card, or dial a USSD code.' },
  { icon: Send, title: 'Pay instantly', description: 'Buy airtime, data, or settle a bill — most complete in seconds.' },
];

const pricingHighlights = [
  { icon: PercentCircle, value: 'Zero', label: 'Transaction fees on every payment' },
  { icon: Timer, value: '3–5%', label: 'Discount on airtime purchases' },
  { icon: Receipt, value: 'Instant', label: 'Delivery, with automatic retries' },
];

const networks = ['MTN', 'Airtel', 'Glo', '9mobile'];
const billers = ['DStv', 'GOtv', 'Startimes', 'EKEDC', 'IKEDC', 'AEDC', 'PHEDC', '+7 more discos'];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Nav */}
      <header className="border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-indigo-600 rounded-md flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-slate-900">KORA</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              Sign in
            </Link>
            <Link to="/register" className="text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors">
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 pt-16 pb-14">
        <div className="max-w-2xl">
          <span className="inline-flex items-center text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-full px-3 py-1 mb-5">
            Trusted by 150,000+ customers across Nigeria
          </span>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.15] text-slate-900">
            Airtime, data and bill payments, <span className="text-indigo-600">without the wait.</span>
          </h1>
          <p className="mt-5 text-slate-500 text-base leading-relaxed max-w-xl">
            KORA is a single platform for buying data, topping up airtime, and paying electricity or cable
            bills — automated, secure, and built for everyday use.
          </p>
          <div className="mt-8 flex items-center gap-3">
            <Link to="/register" className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors">
              Create free account <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/pricing" className="inline-flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-slate-700 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors">
              View pricing
            </Link>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="max-w-6xl mx-auto px-4 py-14 border-t border-gray-200">
        <h2 className="text-lg font-semibold text-slate-900 mb-1">What you can do on KORA</h2>
        <p className="text-sm text-slate-500 mb-8">Every service settles automatically through our provider network.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {services.map((s) => (
            <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-5 hover:border-gray-300 transition-colors">
              <div className="w-9 h-9 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center mb-4">
                <s.icon className="w-4.5 h-4.5" />
              </div>
              <h3 className="font-medium text-slate-900 text-sm">{s.label}</h3>
              <p className="text-slate-500 text-sm mt-1.5 leading-relaxed">{s.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-6xl mx-auto px-4 py-14 border-t border-gray-200">
        <h2 className="text-lg font-semibold text-slate-900 mb-1">How it works</h2>
        <p className="text-sm text-slate-500 mb-8">Three steps from sign-up to your first payment.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((s, i) => (
            <div key={s.title} className="relative">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center shrink-0">
                  <s.icon className="w-4.5 h-4.5" />
                </div>
                <span className="text-xs font-medium text-slate-400">Step {i + 1}</span>
              </div>
              <h3 className="font-medium text-slate-900 text-sm">{s.title}</h3>
              <p className="text-slate-500 text-sm mt-1.5 leading-relaxed">{s.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trust */}
      <section className="border-t border-gray-200 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-14 grid grid-cols-1 md:grid-cols-3 gap-8">
          {trustPoints.map((t) => (
            <div key={t.title} className="flex gap-3.5">
              <div className="w-9 h-9 bg-white border border-gray-200 rounded-lg flex items-center justify-center shrink-0">
                <t.icon className="w-4.5 h-4.5 text-indigo-600" />
              </div>
              <div>
                <h4 className="font-medium text-slate-900 text-sm">{t.title}</h4>
                <p className="text-slate-500 text-sm mt-1 leading-relaxed">{t.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Supported networks & billers */}
      <section className="max-w-6xl mx-auto px-4 py-14 border-t border-gray-200">
        <h2 className="text-lg font-semibold text-slate-900 mb-1">Everything is supported</h2>
        <p className="text-sm text-slate-500 mb-6">All four networks, every major cable provider, and discos nationwide.</p>
        <div className="flex flex-wrap gap-2 mb-3">
          {networks.map((n) => (
            <span key={n} className="text-sm font-medium text-slate-700 bg-white border border-gray-200 rounded-lg px-3.5 py-2">{n}</span>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {billers.map((b) => (
            <span key={b} className="text-sm text-slate-500 bg-gray-50 border border-gray-200 rounded-lg px-3.5 py-2">{b}</span>
          ))}
        </div>
      </section>

      {/* Pricing teaser */}
      <section className="border-t border-gray-200 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-14">
          <div className="flex items-end justify-between flex-wrap gap-3 mb-8">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-1">Transparent pricing</h2>
              <p className="text-sm text-slate-500">No hidden charges, no surprise deductions.</p>
            </div>
            <Link to="/pricing" className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
              View full pricing <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {pricingHighlights.map((p) => (
              <div key={p.label} className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="w-9 h-9 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center mb-4">
                  <p.icon className="w-4.5 h-4.5" />
                </div>
                <p className="text-2xl font-semibold text-slate-900">{p.value}</p>
                <p className="text-slate-500 text-sm mt-1">{p.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="max-w-6xl mx-auto px-4 py-16 border-t border-gray-200 text-center">
        <h2 className="text-2xl font-semibold text-slate-900">Ready to get started?</h2>
        <p className="text-slate-500 text-sm mt-2 max-w-md mx-auto">
          Create your free account and make your first payment in minutes.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link to="/register" className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors">
            Create free account <ArrowRight className="w-4 h-4" />
          </Link>
          <Link to="/login" className="inline-flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-slate-700 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors">
            Sign in
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-2 sm:grid-cols-4 gap-8">
          <div className="col-span-2 sm:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 bg-indigo-600 rounded-md flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-semibold text-slate-900 text-sm">KORA</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">Airtime, data and bill payments for everyday Nigeria.</p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-900 mb-3">Product</p>
            <div className="flex flex-col gap-2 text-xs text-slate-500">
              <Link to="/pricing" className="hover:text-slate-800 transition-colors">Pricing</Link>
              <Link to="/register" className="hover:text-slate-800 transition-colors">Create account</Link>
              <Link to="/login" className="hover:text-slate-800 transition-colors">Sign in</Link>
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-900 mb-3">Legal</p>
            <div className="flex flex-col gap-2 text-xs text-slate-500">
              <a href="#" className="hover:text-slate-800 transition-colors">Terms of service</a>
              <a href="#" className="hover:text-slate-800 transition-colors">Privacy policy</a>
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-900 mb-3">Support</p>
            <div className="flex flex-col gap-2 text-xs text-slate-500">
              <a href="mailto:support@kora.com" className="hover:text-slate-800 transition-colors">support@kora.com</a>
              <span>0800-KORA</span>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-200">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <p className="text-slate-400 text-xs">&copy; {new Date().getFullYear()} KORA. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
