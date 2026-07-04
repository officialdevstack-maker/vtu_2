import { Megaphone } from "lucide-react";

export default function CampaignsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-indigo-100 p-3">
          <Megaphone className="h-6 w-6 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Campaigns</h1>
          <p className="text-sm text-slate-600">
            Manage marketing campaigns and events
          </p>
        </div>
      </div>

      <div className="grid gap-4 rounded-lg border border-slate-200 bg-white p-8 text-center">
        <p className="text-slate-500">Campaign management coming soon</p>
      </div>
    </div>
  );
}
