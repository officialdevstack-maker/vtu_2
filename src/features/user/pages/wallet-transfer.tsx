import { useState } from "react";
import { Send } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { fmt } from "../data/mock";
import { extractApiErrorMessage } from "@/shared/utils";
import { useAuth } from "../../../shared/providers/auth";
import {
  PurchaseShell, ServiceHeader, WalletBalanceBanner, FieldLabel,
  VerifyField, ContinueButton, ConfirmSummary, ConfirmActions, PinField,
  Button, Card, inputCls,
} from "../components/shared-ui";
import { customerService, type WalletTransferRecipient, type WalletTransferResult } from "../services/customerService";

export default function WalletTransferPage() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();

  const [identifier, setIdentifier] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [recipient, setRecipient] = useState<WalletTransferRecipient | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [pin, setPin] = useState("");
  const [step, setStep] = useState<"form" | "confirm" | "success">("form");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<WalletTransferResult | null>(null);

  const amountNumber = Number(amount);

  const handleLookup = async () => {
    if (identifier.trim().length < 3) return;
    setVerifying(true);
    setLookupError(null);
    try {
      const found = await customerService.lookupWalletTransferRecipient(identifier.trim());
      setRecipient(found);
    } catch (err) {
      setRecipient(null);
      setLookupError(extractApiErrorMessage(err, "Could not find a user with that username, email, or phone."));
    } finally {
      setVerifying(false);
    }
  };

  const isFormValid = Boolean(recipient) && amountNumber > 0 && amountNumber <= Number(user?.wallet_balance ?? 0);
  const isConfirmValid = pin.length === 4;

  const handleConfirm = async () => {
    if (!recipient) return;
    if (!isConfirmValid) {
      setError("Enter your 4-digit transaction PIN to continue.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const sent = await customerService.sendWalletTransfer({
        identifier: recipient.username,
        amount: amountNumber,
        pin,
        note: note.trim() || undefined,
      });
      setResult(sent);
      setStep("success");
      await refreshUser();
    } catch (err) {
      setError(extractApiErrorMessage(err, "Could not complete this transfer. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep("form");
    setIdentifier("");
    setRecipient(null);
    setLookupError(null);
    setAmount("");
    setNote("");
    setPin("");
    setResult(null);
    setError(null);
  };

  if (step === "success" && result) {
    return (
      <div className="max-w-md mx-auto">
        <Card className="p-6 text-center">
          <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Send className="w-6 h-6 text-emerald-600" />
          </div>
          <h2 className="text-base font-semibold text-slate-900 mb-1">Transfer successful</h2>
          <p className="text-slate-500 text-sm mb-5">
            {fmt(Number(result.amount))} sent to {recipient?.fullname ?? recipient?.username}
          </p>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-xs text-slate-400 font-mono mb-5">
            Ref: {result.transaction_reference}
          </div>

          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={reset}>
              Send again
            </Button>
            <Button fullWidth onClick={() => navigate("/transactions")}>
              View transactions
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <PurchaseShell>
      <ServiceHeader icon={Send} iconBg="bg-blue-50" iconColor="text-blue-600" title="Send Money" subtitle="Transfer wallet funds to another user instantly" />

      {step === "form" && (
        <div className="p-5 space-y-4">
          <WalletBalanceBanner balance={Number(user?.wallet_balance ?? 0)} />

          <VerifyField
            label="Recipient's username, email, or phone"
            value={identifier}
            onChange={(v) => {
              setIdentifier(v);
              setRecipient(null);
              setLookupError(null);
            }}
            onVerify={() => void handleLookup()}
            verifying={verifying}
            verified={Boolean(recipient)}
            verifiedLabel={recipient ? `${recipient.fullname} (@${recipient.username})` : ""}
            placeholder="e.g. username or 0801..."
          />
          {lookupError && <p className="text-xs text-red-500 -mt-2">{lookupError}</p>}

          <div>
            <FieldLabel>Amount</FieldLabel>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              className={inputCls}
            />
            {amount && amountNumber > Number(user?.wallet_balance ?? 0) && (
              <p className="text-xs text-red-500 mt-1">Amount exceeds your wallet balance.</p>
            )}
          </div>

          <div>
            <FieldLabel hint="Optional">Note</FieldLabel>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What's this for?"
              maxLength={100}
              className={inputCls}
            />
          </div>

          <ContinueButton onClick={() => setStep("confirm")} disabled={!isFormValid} />
        </div>
      )}

      {step === "confirm" && recipient && (
        <div className="p-5 space-y-4">
          <ConfirmSummary
            rows={[
              { label: "To", value: `${recipient.fullname} (@${recipient.username})` },
              { label: "Amount", value: fmt(amountNumber), emphasize: "success" },
              ...(note.trim() ? [{ label: "Note", value: note.trim() }] : []),
            ]}
          />

          {error && (
            <div className="rounded-lg border border-red-100 bg-red-50 px-3.5 py-2.5 text-xs text-red-700">
              {error}
            </div>
          )}

          <PinField value={pin} onChange={setPin} />

          <ConfirmActions
            onBack={() => setStep("form")}
            onConfirm={() => void handleConfirm()}
            loading={loading}
            confirmLabel="Send money"
          />
        </div>
      )}
    </PurchaseShell>
  );
}
