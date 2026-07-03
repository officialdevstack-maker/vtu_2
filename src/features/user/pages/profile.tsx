import { CheckCircle2, Clock } from "lucide-react";
import { mockUser } from "../data/mock";
import { StatusBadge, PageHeader, Card, Button } from "../components/shared-ui";

export default function ProfilePage() {
  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <PageHeader title="My profile" description="Your personal information and verification status" />

      <Card className="p-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-700 rounded-full flex items-center justify-center text-lg font-semibold shrink-0">
            CO
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-slate-900 font-semibold">{mockUser.name}</h2>
            <p className="text-slate-500 text-sm">{mockUser.email}</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <StatusBadge status="verified" />
              <span className="text-slate-400 text-xs">Member since {mockUser.joinedDate}</span>
            </div>
          </div>
          <Button variant="secondary" size="sm">Edit</Button>
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="text-slate-900 font-semibold text-sm mb-0.5">Personal information</h3>
        <p className="text-slate-400 text-xs mb-3">Your personal details as registered</p>
        <div className="divide-y divide-gray-100">
          {[
            ["Full name", mockUser.name],
            ["Email address", mockUser.email],
            ["Phone number", mockUser.phone],
            ["Date of birth", "15 March 1992"],
            ["Address", "12 Adeola Odeku, Victoria Island, Lagos"],
          ].map(([k, v]) => (
            <div key={k} className="flex items-start justify-between py-2.5">
              <span className="text-slate-500 text-sm w-36 shrink-0">{k}</span>
              <span className="text-slate-900 text-sm text-right">{v}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-slate-900 font-semibold text-sm">KYC verification</h3>
            <p className="text-slate-400 text-xs mt-0.5">Identity verification status</p>
          </div>
          <StatusBadge status="verified" />
        </div>
        <div className="space-y-3">
          {[
            { label: "BVN verification", done: true },
            { label: "Government-issued ID", done: true },
            { label: "Selfie verification", done: true },
            { label: "Address verification", done: false },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${item.done ? "bg-emerald-50" : "bg-gray-100"}`}>
                {item.done ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                )}
              </div>
              <span className={`text-sm ${item.done ? "text-slate-900" : "text-slate-400"}`}>{item.label}</span>
              {!item.done && (
                <Button variant="secondary" size="sm" className="ml-auto">Complete</Button>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
