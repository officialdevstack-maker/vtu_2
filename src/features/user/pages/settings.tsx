import { useState } from "react";
import { Shield, Bell, Database, ChevronRight } from "lucide-react";
import { Toggle, PageHeader, Card, Button } from "../components/shared-ui";

export default function SettingsPage() {
  const [twoFA, setTwoFA] = useState(true);
  const [txPin, setTxPin] = useState(true);
  const [biometric, setBiometric] = useState(false);
  const [pushNotifs, setPushNotifs] = useState(true);
  const [emailNotifs, setEmailNotifs] = useState(false);
  const [smsNotifs, setSmsNotifs] = useState(true);

  return (
    <div className="space-y-4">
      <PageHeader title="Settings" description="Manage your security, notifications and account preferences" />

      <Card className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-4 h-4 text-slate-400" />
          <h3 className="text-slate-900 font-semibold text-sm">Security</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {[
            { label: "Two-factor authentication", desc: "Require OTP for all sign-ins", value: twoFA, onChange: setTwoFA },
            { label: "Transaction PIN", desc: "Require PIN for all transactions", value: txPin, onChange: setTxPin },
            { label: "Biometric login", desc: "Use fingerprint or Face ID", value: biometric, onChange: setBiometric },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between py-3">
              <div>
                <p className="text-slate-900 text-sm font-medium">{item.label}</p>
                <p className="text-slate-400 text-xs mt-0.5">{item.desc}</p>
              </div>
              <Toggle value={item.value} onChange={item.onChange} />
            </div>
          ))}
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-slate-900 text-sm font-medium">Change password</p>
              <p className="text-slate-400 text-xs mt-0.5">Last updated 3 months ago</p>
            </div>
            <Button variant="secondary" size="sm">Update</Button>
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <Bell className="w-4 h-4 text-slate-400" />
          <h3 className="text-slate-900 font-semibold text-sm">Notifications</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {[
            { label: "Push notifications", desc: "In-app alerts for transactions", value: pushNotifs, onChange: setPushNotifs },
            { label: "Email notifications", desc: "Receipts and account updates", value: emailNotifs, onChange: setEmailNotifs },
            { label: "SMS alerts", desc: "Transaction confirmations via SMS", value: smsNotifs, onChange: setSmsNotifs },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between py-3">
              <div>
                <p className="text-slate-900 text-sm font-medium">{item.label}</p>
                <p className="text-slate-400 text-xs mt-0.5">{item.desc}</p>
              </div>
              <Toggle value={item.value} onChange={item.onChange} />
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <Database className="w-4 h-4 text-slate-400" />
          <h3 className="text-slate-900 font-semibold text-sm">Account</h3>
        </div>
        <div className="space-y-1.5">
          {[
            { label: "Linked bank accounts", desc: "3 accounts connected" },
            { label: "Saved beneficiaries", desc: "6 saved recipients" },
            { label: "API access", desc: "Developer integrations" },
            { label: "Business profile", desc: "Upgrade to business account" },
          ].map((item) => (
            <button key={item.label} className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-left">
              <div>
                <p className="text-slate-900 text-sm font-medium">{item.label}</p>
                <p className="text-slate-400 text-xs mt-0.5">{item.desc}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
            </button>
          ))}
        </div>
      </Card>

      <Card className="p-5 border-red-100">
        <h3 className="text-red-600 font-semibold text-sm mb-3">Danger zone</h3>
        <button className="w-full flex items-center justify-between p-3 rounded-lg border border-red-100 hover:bg-red-50 transition-colors text-left">
          <div>
            <p className="text-red-700 text-sm font-medium">Deactivate account</p>
            <p className="text-red-400 text-xs mt-0.5">Temporarily disable your account</p>
          </div>
          <ChevronRight className="w-4 h-4 text-red-300 shrink-0" />
        </button>
      </Card>
    </div>
  );
}
