import { useState } from "react";
import { Shield, Bell, Database, ChevronRight } from "lucide-react";
import { Toggle } from "../components/shared-ui";

export default function SettingsPage() {
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
          ].map((item) => (
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
          ].map((item) => (
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
          ].map((item) => (
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

