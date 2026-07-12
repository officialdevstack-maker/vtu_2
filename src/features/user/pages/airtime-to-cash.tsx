import { useEffect, useMemo, useState } from "react";
import { Banknote, Image as ImageIcon, X } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fmt } from "../data/mock";
import { extractApiErrorMessage } from "@/shared/utils";
import {
  PurchaseShell, ServiceHeader, FieldLabel, QuickAmountGrid, ContinueButton,
  ConfirmSummary, ConfirmActions, SuccessScreen, Card, StatusBadge,
  SkeletonLine, EmptyState, inputCls, selectCls,
} from "../components/shared-ui";
import {
  customerService, type AirtimeToCashRequestItem,
} from "../services/customerService";
import { ServiceTabs } from "../components/service-tabs";

const quickAmounts = [500, 1000, 2000, 5000, 10000];

function SubmissionsList() {
  const requestsQuery = useQuery({
    queryKey: ["airtime-to-cash", "mine"],
    queryFn: () => customerService.getMyAirtimeToCashRequests(),
  });
  const requests = requestsQuery.data ?? [];

  if (requestsQuery.isPending) {
    return (
      <Card className="p-4 space-y-3">
        {[...Array(3)].map((_, i) => (
          <SkeletonLine key={i} className="h-10 w-full" />
        ))}
      </Card>
    );
  }

  if (requests.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={Banknote}
          title="No submissions yet"
          description="Requests you submit will show up here with their review status."
        />
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="divide-y divide-gray-100">
        {requests.map((r: AirtimeToCashRequestItem) => (
          <div key={r.id} className="p-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-900 capitalize">
                {r.network} &middot; {fmt(Number(r.amount))}
              </p>
              <p className="text-xs text-slate-400 mt-0.5 truncate">
                {new Date(r.created_at).toLocaleString()}
                {r.status === "rejected" && r.rejection_reason ? ` · ${r.rejection_reason}` : ""}
              </p>
            </div>
            <div className="text-right shrink-0">
              <StatusBadge status={r.status} />
              {r.status === "approved" && (
                <p className="text-xs text-emerald-600 mt-1">+{fmt(Number(r.payout_amount))}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export default function AirtimeToCashPage() {
  const queryClient = useQueryClient();

  const networksQuery = useQuery({
    queryKey: ["airtime-to-cash", "networks"],
    queryFn: () => customerService.getAirtimeToCashNetworks(),
  });
  const networks = useMemo(
    () => (networksQuery.data ?? []).filter((n) => n.airtime_to_cash_active),
    [networksQuery.data],
  );

  const [network, setNetwork] = useState("");
  const [amount, setAmount] = useState("");
  const [senderPhone, setSenderPhone] = useState("");
  const [proofImage, setProofImage] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [step, setStep] = useState<"form" | "confirm" | "success">("form");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AirtimeToCashRequestItem | null>(null);

  useEffect(() => {
    if (networks.length === 0) return;
    if (!networks.some((n) => n.name === network)) {
      setNetwork(networks[0].name);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [networks]);

  const selectedNetwork = networks.find((n) => n.name === network);
  const minAmount = Number(selectedNetwork?.airtime_to_cash_min ?? 100);
  const maxAmount = Number(selectedNetwork?.airtime_to_cash_max ?? 50000);
  const amountNumber = Number(amount);

  const discountQuery = useQuery({
    queryKey: ["discount-preview", "airtimeToCash", network, amountNumber],
    queryFn: () => customerService.previewDiscount("airtimeToCash", network, amountNumber),
    enabled: step === "confirm" && Boolean(network) && amountNumber > 0,
  });
  const payoutAmount = discountQuery.data?.final_amount ?? amountNumber;

  const isFormValid =
    Boolean(selectedNetwork) && amountNumber >= minAmount && amountNumber <= maxAmount && senderPhone.length >= 10;

  const handleProofChange = (file: File | null) => {
    setProofImage(file);
    setProofPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return file ? URL.createObjectURL(file) : null;
    });
  };

  const handleConfirm = async () => {
    if (!selectedNetwork) return;
    setLoading(true);
    setError(null);
    try {
      const submitted = await customerService.submitAirtimeToCash({
        network,
        amount: amountNumber,
        sender_phone: senderPhone,
        proof_image: proofImage,
      });
      setResult(submitted);
      setStep("success");
      queryClient.invalidateQueries({ queryKey: ["airtime-to-cash", "mine"] });
    } catch (err) {
      setError(extractApiErrorMessage(err, "Could not submit this request. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep("form");
    setAmount("");
    setSenderPhone("");
    handleProofChange(null);
    setResult(null);
    setError(null);
  };

  if (step === "success" && result) {
    return (
      <SuccessScreen
        title="Submitted for review"
        message="An admin will verify the transfer and credit your wallet once approved. This usually takes a few minutes."
        onReset={reset}
        resetLabel="Submit another"
      >
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-xs text-slate-400 font-mono mb-5">
          Ref: {result.transaction_reference}
        </div>
      </SuccessScreen>
    );
  }

  return (
    <div className="space-y-5">
      <ServiceTabs />

      <PurchaseShell>
        <ServiceHeader
          icon={Banknote}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          title="Airtime to Cash"
          subtitle="Convert airtime you've sent us into wallet cash"
        />

        {step === "form" && (
          <div className="p-5 space-y-4">
            <div>
              <FieldLabel>Network</FieldLabel>
              {networksQuery.isPending ? (
                <div className="h-10 rounded-lg bg-gray-100 animate-pulse" />
              ) : networks.length === 0 ? (
                <p className="text-xs text-slate-400 py-2">
                  Airtime to cash isn't available right now.
                </p>
              ) : (
                <select value={network} onChange={(e) => setNetwork(e.target.value)} className={selectCls}>
                  {networks.map((n) => (
                    <option key={n.id} value={n.name}>
                      {n.name.toUpperCase()}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {selectedNetwork && (
              <div className="bg-emerald-50 border border-emerald-100 rounded-lg px-3.5 py-3">
                <p className="text-xs text-emerald-700 font-medium mb-0.5">Send airtime to this number</p>
                <p className="text-lg font-mono font-semibold text-emerald-900">{selectedNetwork.airtime_to_cash_destination_number}</p>
                <p className="text-xs text-emerald-600 mt-1">
                  Use your network's airtime transfer code (e.g. *600*Amount*{selectedNetwork.airtime_to_cash_destination_number}#), then fill in the form below.
                </p>
              </div>
            )}

            <div>
              <FieldLabel>Amount sent</FieldLabel>
              <QuickAmountGrid
                amounts={quickAmounts.filter((a) => a >= minAmount && a <= maxAmount)}
                value={amount}
                onChange={setAmount}
              />
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={`Enter amount (${fmt(minAmount)} - ${fmt(maxAmount)})`}
                className={inputCls}
              />
              {amount && (amountNumber < minAmount || amountNumber > maxAmount) && (
                <p className="text-xs text-red-500 mt-1">
                  Amount must be between {fmt(minAmount)} and {fmt(maxAmount)}
                </p>
              )}
            </div>

            <div>
              <FieldLabel>Phone number you sent from</FieldLabel>
              <input
                type="tel"
                value={senderPhone}
                onChange={(e) => setSenderPhone(e.target.value.replace(/\D/g, ""))}
                maxLength={11}
                placeholder="e.g. 08012345678"
                className={`${inputCls} font-mono`}
              />
            </div>

            <div>
              <FieldLabel hint="Optional">Proof screenshot</FieldLabel>
              {proofPreview ? (
                <div className="relative inline-block">
                  <img src={proofPreview} alt="Proof preview" className="h-24 rounded-lg border border-gray-200 object-cover" />
                  <button
                    type="button"
                    onClick={() => handleProofChange(null)}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-slate-900 text-white rounded-full flex items-center justify-center"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <label className="flex items-center gap-2 border border-dashed border-gray-300 rounded-lg px-3.5 py-3 text-xs text-slate-500 cursor-pointer hover:border-gray-400 transition-colors">
                  <ImageIcon className="w-4 h-4 text-slate-400" />
                  Upload a screenshot of the transfer confirmation
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleProofChange(e.target.files?.[0] ?? null)}
                  />
                </label>
              )}
            </div>

            <ContinueButton onClick={() => setStep("confirm")} disabled={!isFormValid} />
          </div>
        )}

        {step === "confirm" && selectedNetwork && (
          <div className="p-5 space-y-4">
            <ConfirmSummary
              rows={[
                { label: "Network", value: network.toUpperCase() },
                { label: "Sent to", value: selectedNetwork.airtime_to_cash_destination_number ?? "—" },
                { label: "Amount sent", value: fmt(amountNumber) },
                { label: "Sender phone", value: senderPhone },
                { label: "You'll receive", value: fmt(payoutAmount), emphasize: "success" },
              ]}
            />

            <p className="text-xs text-slate-400">
              This request is manually reviewed by an admin before your wallet is credited.
            </p>

            {error && (
              <div className="rounded-lg border border-red-100 bg-red-50 px-3.5 py-2.5 text-xs text-red-700">
                {error}
              </div>
            )}

            <ConfirmActions
              onBack={() => setStep("form")}
              onConfirm={() => void handleConfirm()}
              loading={loading}
              confirmLabel="Submit for review"
            />
          </div>
        )}
      </PurchaseShell>

      {step === "form" && (
        <div className="max-w-xl mx-auto">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Recent submissions</h3>
          <SubmissionsList />
        </div>
      )}
    </div>
  );
}
