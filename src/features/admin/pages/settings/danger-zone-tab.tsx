import { useState } from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import { apiClient } from "@shared/api/apiClient";
import { Card, Button, inputCls } from "../../../user/components/shared-ui";
import { SectionTitle, ErrorBanner, extractErrorMessage } from "./shared";

type ApiEnvelope<T> = { success: boolean; message: string; data: T };

type ResetCounts = {
  transactions: number;
  notifications: number;
  child_customers: number;
  child_transactions: number;
  child_directives: number;
  child_sync_events: number;
  users: number;
};

const CONFIRMATION_PHRASE = "DELETE ALL DATA";

function resetWebsite(confirmationPhrase: string): Promise<ResetCounts> {
  return apiClient
    .post<ApiEnvelope<ResetCounts>>("/admin/reset-website", {
      confirmation_phrase: confirmationPhrase,
    })
    .then((r) => r.data.data);
}

function ResetConfirmModal({
  onClose,
  onDone,
}: {
  onClose: () => void;
  onDone: (counts: ResetCounts) => void;
}) {
  const [phrase, setPhrase] = useState("");
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const matches = phrase === CONFIRMATION_PHRASE;

  const handleConfirm = async () => {
    if (!matches) return;
    setResetting(true);
    setError(null);
    try {
      const counts = await resetWebsite(phrase);
      onDone(counts);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl border border-red-200 w-full max-w-md shadow-xl p-5">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-9 h-9 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4.5 h-4.5" />
          </div>
          <h3 className="font-semibold text-slate-900 text-sm">This cannot be undone</h3>
        </div>

        <ul className="text-xs text-red-800 bg-red-50 border border-red-100 rounded-lg px-3.5 py-3 space-y-1 mb-4 list-disc list-inside">
          <li>Every non-admin customer account will be permanently deleted</li>
          <li>Every transaction record will be permanently deleted</li>
          <li>All notifications and synced affiliate customer/transaction data will be permanently deleted</li>
        </ul>
        <p className="text-xs text-slate-500 mb-4">
          Provider/gateway configuration, the product catalog, pricing, site settings, and admin
          accounts are <strong>not</strong> affected.
        </p>

        {error && (
          <div className="mb-3">
            <ErrorBanner message={error} />
          </div>
        )}

        <label className="block text-xs font-medium text-slate-600 mb-1.5">
          Type <code className="font-mono bg-gray-100 px-1 py-0.5 rounded text-slate-800">{CONFIRMATION_PHRASE}</code> to
          confirm
        </label>
        <input
          value={phrase}
          onChange={(e) => setPhrase(e.target.value)}
          placeholder={CONFIRMATION_PHRASE}
          className={`${inputCls} font-mono mb-4`}
          autoFocus
          autoComplete="off"
        />

        <div className="flex gap-3">
          <Button variant="secondary" fullWidth onClick={onClose} disabled={resetting}>
            Cancel
          </Button>
          <Button
            variant="danger"
            fullWidth
            disabled={!matches || resetting}
            loading={resetting}
            onClick={() => void handleConfirm()}
          >
            {resetting ? "Resetting…" : "Reset website"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function ResetDoneModal({ counts, onClose }: { counts: ResetCounts; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl border border-slate-200/70 w-full max-w-sm shadow-xl p-5">
        <h3 className="font-semibold text-slate-900 text-sm mb-3">Website data has been reset</h3>
        <div className="text-xs text-slate-600 space-y-1 mb-4">
          <p>{counts.users} customer account(s) deleted</p>
          <p>{counts.transactions} transaction(s) deleted</p>
          <p>{counts.notifications} notification(s) deleted</p>
          <p>
            {counts.child_customers} affiliate customer record(s), {counts.child_transactions} affiliate
            transaction(s) deleted
          </p>
        </div>
        <Button fullWidth onClick={onClose}>
          Done
        </Button>
      </div>
    </div>
  );
}

export function DangerZoneTab() {
  const [confirming, setConfirming] = useState(false);
  const [doneCounts, setDoneCounts] = useState<ResetCounts | null>(null);

  return (
    <>
      <Card className="p-5 border-red-200">
        <SectionTitle>Danger zone</SectionTitle>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="max-w-md">
            <p className="text-sm font-medium text-slate-900">Reset website data</p>
            <p className="text-xs text-slate-500 mt-1">
              Permanently deletes every customer account, transaction, notification, and synced
              affiliate customer/transaction record. Provider/gateway configuration, the product
              catalog, pricing, site settings, and admin accounts are kept. This cannot be undone.
            </p>
          </div>
          <Button variant="danger" size="sm" onClick={() => setConfirming(true)}>
            <Trash2 className="w-3.5 h-3.5" /> Reset website
          </Button>
        </div>
      </Card>

      {confirming && (
        <ResetConfirmModal
          onClose={() => setConfirming(false)}
          onDone={(counts) => {
            setConfirming(false);
            setDoneCounts(counts);
          }}
        />
      )}

      {doneCounts && <ResetDoneModal counts={doneCounts} onClose={() => setDoneCounts(null)} />}
    </>
  );
}
