import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, Clock3, Trophy } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { extractApiErrorMessage } from "@/shared/utils";
import { useAuth } from "@/shared/providers/auth";
import {
  Button,
  Card,
  ContinueButton,
  FieldLabel,
  PurchaseShell,
  ServiceHeader,
  WalletBalanceBanner,
  inputCls,
  selectCls,
} from "../components/shared-ui";
import { ServiceTabs } from "../components/service-tabs";
import { customerService, type PurchaseResult } from "../services/customerService";

const newIdempotencyKey = () =>
  globalThis.crypto?.randomUUID?.() ?? `BET-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export default function BettingPage() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const catalog = useQuery({
    queryKey: ["betting-providers"],
    queryFn: customerService.getBettingProviders,
  });
  const providers = catalog.data?.providers ?? [];
  const [provider, setProvider] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [amount, setAmount] = useState("");
  const [pin, setPin] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifiedName, setVerifiedName] = useState<string | null>(null);
  const [verificationComplete, setVerificationComplete] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PurchaseResult | null>(null);
  const idempotencyKey = useRef(newIdempotencyKey());

  useEffect(() => {
    if (providers.length && !providers.some((item) => item.slug === provider)) {
      setProvider(providers[0].slug);
    }
  }, [provider, providers]);

  const selected = useMemo(() => providers.find((item) => item.slug === provider), [provider, providers]);
  const value = Number(amount);
  const minimum = Number(selected?.minimum_amount ?? 0);
  const maximum = Number(selected?.maximum_amount ?? 0);
  const fee = selected ? Number(selected.flat_fee) + value * Number(selected.percentage_fee) / 100 : 0;
  const mustVerify = selected?.verification_supported ?? true;
  const valid = Boolean(selected && customerId.trim().length >= 3 && value >= minimum && value <= maximum
    && (!mustVerify || verificationComplete) && pin.length === 4);

  const resetVerification = () => {
    setVerificationComplete(false);
    setVerifiedName(null);
    setError(null);
  };

  const verify = async () => {
    if (!selected || customerId.trim().length < 3) return;
    setVerifying(true);
    setError(null);
    try {
      const response = await customerService.verifyBettingAccount(selected.slug, customerId.trim());
      setVerificationComplete(response.verified === true || response.verification_supported === false);
      setVerifiedName(response.customer_name ?? null);
    } catch (cause) {
      setVerificationComplete(false);
      setError(extractApiErrorMessage(cause, "We could not verify that betting account."));
    } finally {
      setVerifying(false);
    }
  };

  const submit = async () => {
    if (!valid || loading) return;
    setLoading(true);
    setError(null);
    try {
      const purchase = await customerService.fundBettingAccount({
        provider,
        customer_id: customerId.trim(),
        amount: value,
        pin,
        idempotency_key: idempotencyKey.current,
      });
      setResult(purchase);
      await refreshUser();
    } catch (cause) {
      setError(extractApiErrorMessage(cause, "Betting funding could not be completed."));
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setCustomerId("");
    setAmount("");
    setPin("");
    setResult(null);
    resetVerification();
    idempotencyKey.current = newIdempotencyKey();
  };

  if (result) {
    const pending = result.status === "pending";
    return (
      <div className="mx-auto max-w-md">
        <Card className="p-6 text-center">
          <div className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full ${pending ? "bg-amber-50" : "bg-emerald-50"}`}>
            {pending ? <Clock3 className="h-6 w-6 text-amber-600" /> : <CheckCircle2 className="h-6 w-6 text-emerald-600" />}
          </div>
          <h2 className="text-base font-semibold text-slate-900">{pending ? "Funding is processing" : "Account funded"}</h2>
          <p className="mt-1 text-sm text-slate-500">{result.response_message}</p>
          <div className="my-5 rounded-lg bg-gray-50 p-3 font-mono text-xs text-slate-500">Ref: {result.transaction_reference}</div>
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={reset}>Fund again</Button>
            <Button fullWidth onClick={() => navigate("/transactions")}>View history</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-xl space-y-3">
      <ServiceTabs />
      <PurchaseShell>
        <ServiceHeader icon={Trophy} iconBg="bg-orange-50" iconColor="text-orange-600" title="Betting" subtitle="Fund your betting account securely" />
        <div className="space-y-4 p-5">
          <WalletBalanceBanner balance={Number(user?.wallet_balance ?? 0)} />
          {catalog.isPending ? <div className="h-10 animate-pulse rounded-lg bg-gray-100" /> : providers.length === 0 ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">Betting funding is currently unavailable.</div>
          ) : (
            <>
              <div>
                <FieldLabel>Betting provider</FieldLabel>
                <select value={provider} onChange={(event) => { setProvider(event.target.value); resetVerification(); }} className={selectCls}>
                  {providers.map((item) => <option key={item.id} value={item.slug}>{item.name}</option>)}
                </select>
              </div>
              <div>
                <FieldLabel>Customer / User ID</FieldLabel>
                <div className="flex gap-2">
                  <input value={customerId} onChange={(event) => { setCustomerId(event.target.value); resetVerification(); }} className={inputCls} autoComplete="off" />
                  {mustVerify && <Button variant="secondary" onClick={() => void verify()} disabled={verifying || customerId.trim().length < 3}>{verifying ? "Checking…" : "Verify"}</Button>}
                </div>
                {verificationComplete && <p className="mt-1.5 text-xs text-emerald-600">Account verified{verifiedName ? ` · ${verifiedName}` : ""}</p>}
              </div>
              <div>
                <FieldLabel>Amount</FieldLabel>
                <input type="number" min={minimum} max={maximum} value={amount} onChange={(event) => setAmount(event.target.value)} className={inputCls} />
                <p className="mt-1 text-xs text-slate-400">Allowed: ₦{minimum.toLocaleString()} – ₦{maximum.toLocaleString()}{fee > 0 ? ` · Fee ₦${fee.toLocaleString()}` : ""}</p>
              </div>
              <div>
                <FieldLabel>Transaction PIN</FieldLabel>
                <input type="password" inputMode="numeric" maxLength={4} value={pin} onChange={(event) => setPin(event.target.value.replace(/\D/g, ""))} className={inputCls} autoComplete="off" />
              </div>
              {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
              <ContinueButton onClick={() => void submit()} disabled={!valid || loading}>{loading ? "Funding account…" : "Fund Account"}</ContinueButton>
            </>
          )}
        </div>
      </PurchaseShell>
    </div>
  );
}
