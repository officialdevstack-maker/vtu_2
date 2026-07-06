import { useEffect, useMemo, useState } from "react";
import { Landmark, CheckCircle2, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fmt } from "../data/mock";
import { extractApiErrorMessage } from "@/shared/utils";
import { useAuth } from "../../../shared/providers/auth";
import {
  PurchaseShell, ServiceHeader, WalletBalanceBanner, FieldLabel,
  ContinueButton, ConfirmSummary, ConfirmActions, PinField,
  Button, Card, EmptyState, inputCls, selectCls,
} from "../components/shared-ui";
import { customerService, type WalletWithdrawalItem } from "../services/customerService";

export default function WalletWithdrawalPage() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();

  const banksQuery = useQuery({
    queryKey: ["wallet-withdrawal-banks"],
    queryFn: () => customerService.getWithdrawalBanks(),
  });
  const banks = useMemo(() => banksQuery.data?.banks ?? [], [banksQuery.data]);

  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [amount, setAmount] = useState("");
  const [pin, setPin] = useState("");
  const [step, setStep] = useState<"form" | "confirm" | "success">("form");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<WalletWithdrawalItem | null>(null);

  useEffect(() => {
    if (banks.length > 0 && !bankCode) setBankCode(banks[0].code);
  }, [banks, bankCode]);

  const selectedBank = banks.find((b) => b.code === bankCode);
  const amountNumber = Number(amount);

  const isFormValid =
    Boolean(selectedBank) &&
    accountNumber.trim().length >= 10 &&
    accountName.trim().length > 1 &&
    amountNumber > 0 &&
    amountNumber <= Number(user?.wallet_balance ?? 0);
  const isConfirmValid = pin.length === 4;

  const handleConfirm = async () => {
    if (!selectedBank) return;
    if (!isConfirmValid) {
      setError("Enter your 4-digit transaction PIN to continue.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const submitted = await customerService.submitWalletWithdrawal({
        amount: amountNumber,
        bank_code: selectedBank.code,
        bank_name: selectedBank.name,
        account_number: accountNumber.trim(),
        account_name: accountName.trim(),
        pin,
      });
      setResult(submitted);
      setStep("success");
      await refreshUser();
    } catch (err) {
      setError(extractApiErrorMessage(err, "Could not submit this withdrawal. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep("form");
    setAccountNumber("");
    setAccountName("");
    setAmount("");
    setPin("");
    setResult(null);
    setError(null);
  };

  if (step === "success" && result) {
    const isPending = result.status === "pending";
    return (
      <div className="max-w-md mx-auto">
        <Card className="p-6 text-center">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${isPending ? "bg-amber-50" : "bg-emerald-50"}`}>
            {isPending ? <Clock className="w-6 h-6 text-amber-600" /> : <CheckCircle2 className="w-6 h-6 text-emerald-600" />}
          </div>
          <h2 className="text-base font-semibold text-slate-900 mb-1">
            {isPending ? "Withdrawal submitted" : "Withdrawal sent"}
          </h2>
          <p className="text-slate-500 text-sm mb-5">
            {fmt(Number(result.amount))} to {result.bank_name} · {result.account_number}
            {isPending && " — awaiting admin review"}
          </p>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-xs text-slate-400 font-mono mb-5">
            Ref: {result.transaction_reference}
          </div>

          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={reset}>
              Withdraw again
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
      <ServiceHeader icon={Landmark} iconBg="bg-indigo-50" iconColor="text-indigo-600" title="Withdraw to Bank" subtitle="Move wallet funds to your bank account" />

      {step === "form" && (
        <div className="p-5 space-y-4">
          <WalletBalanceBanner balance={Number(user?.wallet_balance ?? 0)} />

          {banksQuery.isPending ? (
            <div className="h-10 rounded-lg bg-gray-100 animate-pulse" />
          ) : !banksQuery.data?.available ? (
            <EmptyState
              icon={Landmark}
              title="Withdrawals aren't available right now"
              description="Bank withdrawals are temporarily unavailable. Please try again later."
            />
          ) : (
            <>
              <div>
                <FieldLabel>Bank</FieldLabel>
                <select value={bankCode} onChange={(e) => setBankCode(e.target.value)} className={selectCls}>
                  {banks.map((b) => (
                    <option key={b.code} value={b.code}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <FieldLabel>Account number</FieldLabel>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
                  maxLength={10}
                  placeholder="10-digit account number"
                  className={`${inputCls} font-mono`}
                />
              </div>

              <div>
                <FieldLabel>Account name</FieldLabel>
                <input
                  type="text"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="Account holder's name"
                  className={inputCls}
                />
              </div>

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

              <ContinueButton onClick={() => setStep("confirm")} disabled={!isFormValid} />
            </>
          )}
        </div>
      )}

      {step === "confirm" && selectedBank && (
        <div className="p-5 space-y-4">
          <ConfirmSummary
            rows={[
              { label: "Bank", value: selectedBank.name },
              { label: "Account number", value: accountNumber },
              { label: "Account name", value: accountName },
              { label: "Amount", value: fmt(amountNumber), emphasize: "success" },
            ]}
          />

          <p className="text-xs text-slate-400">
            Your wallet is debited now; the payout may be reviewed before it's sent to your bank.
          </p>

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
            confirmLabel="Withdraw"
          />
        </div>
      )}
    </PurchaseShell>
  );
}
