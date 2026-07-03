import { Link } from 'react-router-dom';
import { Phone, Wifi, Tv, Zap, ShieldCheck, ArrowRight, Clock, Users } from 'lucide-react';

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

      {/* Footer */}
      <footer className="border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-slate-400 text-xs">&copy; {new Date().getFullYear()} KORA. All rights reserved.</p>
          <div className="flex items-center gap-5 text-xs text-slate-500">
            <a href="#" className="hover:text-slate-800 transition-colors">Terms</a>
            <a href="#" className="hover:text-slate-800 transition-colors">Privacy</a>
            <a href="#" className="hover:text-slate-800 transition-colors">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
