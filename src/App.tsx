import { Link } from 'react-router-dom';
import { Phone, Wifi, Tv, Zap, CheckCircle, ArrowRight, Shield, Zap as FastIcon, Percent } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen font-sans selection:bg-indigo-500 selection:text-white">
      
      {/* Hero Section */}
      <header className="relative max-w-6xl mx-auto px-4 pt-16 pb-24 text-center overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-72 bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />
        
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-6">
          <Percent className="w-3.5 h-3.5" /> Get up to 5% cashback on top-ups
        </span>
        
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight max-w-3xl mx-auto leading-[1.15]">
          Ultra-Fast <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-500">VTU & Bill Payments</span> At Cheaper Rates
        </h1>
        
        <p className="mt-6 text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
          Instantly buy cheap data bundles, top up airtime, print recharge cards, and pay electricity or cable TV bills—all from one secure automated platform.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row justify-center items-center gap-4">
          <Link to="/auth" className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 transition text-white px-8 py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20">
            Open Auth Page <ArrowRight className="w-4 h-4" />
          </Link>
          <button className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 border border-slate-800 transition px-8 py-3.5 rounded-xl font-semibold text-slate-300">
            View Pricing API
          </button>
        </div>
      </header>

      {/* Services Grid */}
      <section className="max-w-6xl mx-auto px-4 py-16 border-t border-slate-900">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Our VTU Offerings</h2>
          <p className="text-slate-400 text-sm mt-2">Automated services instantly delivered to any network terminal.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-slate-900/50 border border-slate-800/80 p-6 rounded-2xl hover:border-slate-700 transition">
            <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl w-fit mb-4">
              <Phone className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-lg">Instant Airtime</h3>
            <p className="text-slate-400 text-sm mt-2">Top up MTN, Airtel, Glo, and 9mobile instantly with discounts.</p>
          </div>

          <div className="bg-slate-900/50 border border-slate-800/80 p-6 rounded-2xl hover:border-slate-700 transition">
            <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl w-fit mb-4">
              <Wifi className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-lg">SME & Corporate Data</h3>
            <p className="text-slate-400 text-sm mt-2">Low-cost data plans with 30 days validity. Automated API delivery.</p>
          </div>

          <div className="bg-slate-900/50 border border-slate-800/80 p-6 rounded-2xl hover:border-slate-700 transition">
            <div className="p-3 bg-purple-500/10 text-purple-500 rounded-xl w-fit mb-4">
              <Tv className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-lg">Cable TV Bills</h3>
            <p className="text-slate-400 text-sm mt-2">Renew DSTV, GOTV, and Startimes quickly without extra charge friction.</p>
          </div>

          <div className="bg-slate-900/50 border border-slate-800/80 p-6 rounded-2xl hover:border-slate-700 transition">
            <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl w-fit mb-4">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-lg">Electricity Tokens</h3>
            <p className="text-slate-400 text-sm mt-2">Pay prepaid/postpaid disco meters instantly and fetch activation keys.</p>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="max-w-6xl mx-auto px-4 py-16 bg-slate-900/20 border-y border-slate-900 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="flex gap-4">
          <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg h-fit">
            <FastIcon className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-semibold">100% Automated</h4>
            <p className="text-slate-400 text-sm mt-1">Transactions are instantly processed via ultra-reliable API nodes without delay.</p>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg h-fit">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-semibold">Secure Wallet Funding</h4>
            <p className="text-slate-400 text-sm mt-1">Get your unique dedicated bank account numbers for auto-wallet funding.</p>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg h-fit">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-semibold">Developer Friendly</h4>
            <p className="text-slate-400 text-sm mt-1">Integrate our robust API endpoints into your own apps to resell data seamlessly.</p>
          </div>
        </div>
      </section>

      {/* Simple Footer */}
      <footer className="max-w-6xl mx-auto px-4 py-8 text-center text-slate-500 text-xs">
        <p>&copy; {new Date().getFullYear()} VTU Platform. All rights reserved.</p>
      </footer>
    </div>
  );
}