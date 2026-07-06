import { useEffect, useState } from "react";
import { CheckCircle2, Eye, EyeOff, LockKeyhole } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Card, inputCls } from "@/features/user/components/shared-ui";
import { AuthLayout, authCardCls, authInputCls } from "../components/AuthLayout";
import { saveMockPin } from "../mockSession";
import { transactionPinSchema, type TransactionPinFormData } from "../validators";

export default function CreateTransactionPinPage() {
  const [showPin, setShowPin] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TransactionPinFormData>({
    resolver: zodResolver(transactionPinSchema),
  });

  useEffect(() => {
    if (!success) return;
    const timeout = window.setTimeout(() => navigate("/dashboard", { replace: true }), 900);
    return () => window.clearTimeout(timeout);
  }, [navigate, success]);

  const onSubmit = async () => {
    await new Promise((resolve) => window.setTimeout(resolve, 450));
    saveMockPin();
    setSuccess(true);
  };

  const pinType = showPin ? "text" : "password";

  return (
    <AuthLayout>
      <Card className={authCardCls}>
        {success ? (
          <div className="py-4 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950">PIN created</h1>
            <p className="mt-2 text-sm text-slate-500">Your transaction PIN is ready. Taking you to your dashboard.</p>
          </div>
        ) : (
          <>
            <div className="mb-7">
              <h1 className="text-2xl font-semibold text-slate-950 tracking-tight">Create transaction PIN</h1>
              <p className="text-slate-500 text-sm mt-1">
                Use exactly 4 digits. You will need this for wallet actions.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Transaction PIN</label>
                <div className="relative">
                  <LockKeyhole className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={pinType}
                    inputMode="numeric"
                    maxLength={4}
                    placeholder="4 digits"
                    {...register("pin", {
                      onChange: (event) => setValue("pin", event.target.value.replace(/\D/g, "").slice(0, 4), { shouldValidate: true }),
                    })}
                    className={`${inputCls} ${authInputCls} pl-9 pr-10 tracking-[0.35em] ${errors.pin ? "border-red-300" : ""}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    aria-label={showPin ? "Hide PIN" : "Show PIN"}
                  >
                    {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.pin && <p className="text-red-500 text-xs mt-1">{errors.pin.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Confirm Transaction PIN</label>
                <div className="relative">
                  <LockKeyhole className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={pinType}
                    inputMode="numeric"
                    maxLength={4}
                    placeholder="Repeat PIN"
                    {...register("confirmPin", {
                      onChange: (event) => setValue("confirmPin", event.target.value.replace(/\D/g, "").slice(0, 4), { shouldValidate: true }),
                    })}
                    className={`${inputCls} ${authInputCls} pl-9 tracking-[0.35em] ${errors.confirmPin ? "border-red-300" : ""}`}
                  />
                </div>
                {errors.confirmPin && <p className="text-red-500 text-xs mt-1">{errors.confirmPin.message}</p>}
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                loading={isSubmitting}
                fullWidth
                className="rounded-2xl bg-[#111827] py-4 shadow-lg shadow-[#111827]/20 hover:bg-[#111827] hover:opacity-95"
              >
                {isSubmitting ? "" : "Create PIN"}
              </Button>
            </form>
          </>
        )}
      </Card>
    </AuthLayout>
  );
}
