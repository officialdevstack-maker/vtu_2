import { CheckCircle, Clock } from "lucide-react";
import { mockUser } from "../data/mock";
import { StatusBadge } from "../components/shared-ui";

export default function ProfilePage() {
  return (
    <div className="p-6 pb-24 lg:pb-6 max-w-2xl mx-auto space-y-4">
      <div className="bg-white border border-gray-100 rounded-xl p-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-xl font-semibold shrink-0">
            CO
          </div>
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
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${item.done ? "bg-emerald-100" : "bg-gray-100"}`}>
                {item.done ? (
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                )}
              </div>
              <span className={`text-sm ${item.done ? "text-gray-900" : "text-gray-400"}`}>{item.label}</span>
              {!item.done && (
                <button className="ml-auto text-xs text-indigo-600 font-medium border border-indigo-200 px-2.5 py-1 rounded-lg hover:bg-indigo-50 transition">
                  Complete
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
