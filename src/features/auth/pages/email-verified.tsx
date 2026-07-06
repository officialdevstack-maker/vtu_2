import { CheckCircle2, XCircle } from "lucide-react";
import { Link as RouterLink, useSearchParams } from "react-router-dom";
import { Card } from "@/features/user/components/shared-ui";
import { AuthLayout, authCardCls } from "../components/AuthLayout";

const REASON_MESSAGES: Record<string, string> = {
  invalid: "This verification link isn't valid — it may have been tampered with.",
  invalid_hash: "This verification link doesn't match any account.",
  user_not_found: "We couldn't find an account for this verification link.",
  error: "Something went wrong while verifying your email.",
};

// Landing page for every redirect VerifyEmailController::verifyFromLink can
// send the browser to — success (?verified=1), already-verified
// (?verified=1&already=true), or failure (?reason=...). One page for all
// three since they're just different query-param states of the same result.
export default function EmailVerifiedPage() {
  const [searchParams] = useSearchParams();
  const verified = searchParams.get("verified") === "1";
  const already = searchParams.get("already") === "true";
  const reason = searchParams.get("reason");

  return (
    <AuthLayout>
      <Card className={authCardCls}>
        <div className="py-4 text-center">
          <div
            className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border ${
              verified ? "border-emerald-100 bg-emerald-50" : "border-red-100 bg-red-50"
            }`}
          >
            {verified ? (
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            ) : (
              <XCircle className="h-6 w-6 text-red-600" />
            )}
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
            {verified ? (already ? "Already verified" : "Email verified") : "Verification failed"}
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            {verified
              ? already
                ? "Your email address was already verified — you're all set."
                : "Your email address has been confirmed."
              : (reason && REASON_MESSAGES[reason]) ??
                "We couldn't verify your email. Please request a new verification link."}
          </p>

          <RouterLink
            to="/login"
            className="mt-6 flex w-full items-center justify-center rounded-2xl bg-[#111827] py-4 text-sm font-medium text-white shadow-lg shadow-[#111827]/20 transition-opacity hover:opacity-95"
          >
            Continue to sign in
          </RouterLink>
        </div>
      </Card>
    </AuthLayout>
  );
}
