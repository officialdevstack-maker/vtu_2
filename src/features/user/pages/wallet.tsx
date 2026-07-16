import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Eye, EyeOff, Landmark, ArrowDownLeft, Building2 } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import {
  PageHeader,
  Card,
  Button,
  CopyButton,
  StatusBadge,
  EmptyState,
} from "../components/shared-ui";
import { useAuth, type UserTransaction } from "../../../shared/providers/auth";
import { walletService } from "../services/walletService";
import { fmt } from "../data/mock";
import {
  transactionTypeMeta,
  isCredit,
  toNumber,
  badgeStatus,
  dateLabel,
} from "../utils/transactionDisplay";
import WalletTransferPage from "./wallet-transfer";
import WalletWithdrawalPage from "./wallet-withdrawal";
import { useDashboardUser } from "../hooks/use-dashboard-user";

type Tab = "fund" | "send" | "withdraw";

const tabs: { id: Tab; label: string }[] = [
  { id: "fund", label: "Fund wallet" },
  { id: "send", label: "Send money" },
  { id: "withdraw", label: "Withdraw to bank" },
];

function FundTab() {
  const { refreshUser } = useAuth();
  const { user } = useDashboardUser();
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const fundingQuery = useQuery({
    queryKey: ["wallet-funding-account"],
    queryFn: walletService.getFundingAccount,
    retry: 1,
    staleTime: 30_000,
  });

  const banks = user?.banks ?? [];

  const recentFundings = useMemo<UserTransaction[]>(
    () =>
      [...(user?.transactions ?? [])]
        .filter(
          (tx) =>
            tx.transaction_type === "wallet_funding" ||
            tx.transaction_type === "manual_funding",
        )
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        )
        .slice(0, 8),
    [user?.transactions],
  );

  const handleGenerateAccount = async () => {
    setGenerating(true);
    setGenerateError(null);
    try {
      await walletService.generateVirtualAccounts();
      await fundingQuery.refetch();
      await refreshUser();
      await new Promise((resolve) => window.setTimeout(resolve, 200));
    } catch {
      setGenerateError(
        "Could not set up your account right now. Please try again shortly.",
      );
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Balance banner */}
      <Card className="bg-slate-900 p-4 border-slate-900 sm:p-5">
        <p className="text-slate-400 text-xs mb-1.5">Available balance</p>
        <div className="flex min-w-0 items-center gap-3">
          <span className="min-w-0 break-words text-xl font-semibold text-white tabular-nums sm:text-2xl">
            {balanceVisible ? fmt(toNumber(user?.wallet_balance)) : "₦ ••••••"}
          </span>
          <button
            onClick={() => setBalanceVisible((v) => !v)}
            className="text-slate-400 hover:text-white transition-colors"
          >
            {balanceVisible ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>
      </Card>

      {/* Virtual account details */}
      <Card className="p-5">
        <h3 className="text-slate-900 font-semibold text-sm mb-3">
          Fund your wallet
        </h3>

        {fundingQuery.isPending ? (
          <div className="space-y-3" aria-label="Loading funding account">
            <div className="h-20 animate-pulse rounded-lg bg-gray-100" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-gray-100" />
          </div>
        ) : fundingQuery.data?.status === "ready" && fundingQuery.data.account ? (
          <div className="space-y-3">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-900 text-sm font-medium">{fundingQuery.data.account.bank_name}</span>
                <StatusBadge status="active" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 text-sm">Account number</span>
                <CopyButton value={fundingQuery.data.account.account_number} label="account number" />
              </div>
              {fundingQuery.data.account.account_name && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-sm">Account name</span>
                  <span className="text-slate-900 text-sm font-medium">{fundingQuery.data.account.account_name}</span>
                </div>
              )}
            </div>
          </div>
        ) : banks.length === 0 ? (
          <>
            {generateError && (
              <div className="mb-3 rounded-lg border border-red-100 bg-red-50 px-3.5 py-2.5 text-xs text-red-700">
                {generateError}
              </div>
            )}
            <EmptyState
              icon={Building2}
              title="No account set up yet"
              description={fundingQuery.data?.message ?? (fundingQuery.isError ? "We could not load your funding account." : "Set up your dedicated account number to start funding your wallet by bank transfer.")}
              action={
                <Button
                  size="sm"
                  onClick={() => void handleGenerateAccount()}
                  loading={generating}
                  disabled={generating}
                >
                  {generating ? "Setting up…" : "Set up my account"}
                </Button>
              }
            />
          </>
        ) : (
          <div className="space-y-3">
            {banks.map((bank) => (
              <div
                key={bank.id}
                className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#111827]/10 text-[#111827] flex items-center justify-center shrink-0">
                      <Landmark className="w-4 h-4" />
                    </div>
                    <span className="text-slate-900 text-sm font-medium">
                      {bank.bank_name}
                    </span>
                  </div>
                  <StatusBadge status={bank.status} />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-sm">Account number</span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-900 text-sm font-medium font-mono">
                      {bank.bank_account}
                    </span>
                    <CopyButton
                      value={bank.bank_account}
                      label="account number"
                    />
                  </div>
                </div>

                {bank.account_name && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 text-sm">Account name</span>
                    <span className="text-slate-900 text-sm font-medium">
                      {bank.account_name}
                    </span>
                  </div>
                )}
              </div>
            ))}

            <p className="text-slate-400 text-xs">
              Transfer any amount from any bank to the account above — your
              wallet is credited automatically, usually within minutes.
            </p>
          </div>
        )}
      </Card>

      {/* Recent fundings */}
      {recentFundings.length > 0 && (
        <Card className="p-5">
          <h3 className="text-slate-900 font-semibold text-sm mb-3">
            Recent fundings
          </h3>
          <div className="divide-y divide-gray-100">
            {recentFundings.map((tx) => {
              const meta = transactionTypeMeta[tx.transaction_type] ?? {
                label: tx.transaction_type,
                icon: ArrowDownLeft,
              };
              const Icon = meta.icon;
              const credit = isCredit(tx);
              return (
                <div
                  key={tx.id}
                  className="flex items-center justify-between py-2.5"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-slate-900 font-medium truncate">
                        {meta.label}
                      </p>
                      <p className="text-xs text-slate-400">
                        {dateLabel(tx.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p
                      className={`text-sm font-medium tabular-nums ${credit ? "text-emerald-600" : "text-slate-900"}`}
                    >
                      {credit ? "+" : ""}
                      {fmt(toNumber(tx.amount))}
                    </p>
                    <StatusBadge status={badgeStatus(tx.status)} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}

export default function WalletPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get("tab") as Tab | null) ?? "fund";
  const setActiveTab = (tab: Tab) =>
    setSearchParams({ tab }, { replace: true });

  return (
    <div className="mx-auto w-full max-w-xl space-y-5">
      <PageHeader
        title="Wallet"
        description="Fund, send, and withdraw your wallet balance"
      />

      <div className="grid w-full grid-cols-1 gap-1.5 rounded-lg bg-gray-100 p-1 min-[340px]:grid-cols-3 sm:w-fit">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`min-h-11 min-w-0 rounded-md px-2 py-1.5 text-xs font-medium leading-tight transition-colors ${
              activeTab === t.id
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "fund" && <FundTab />}
      {activeTab === "send" && <WalletTransferPage />}
      {activeTab === "withdraw" && <WalletWithdrawalPage />}
    </div>
  );
}
