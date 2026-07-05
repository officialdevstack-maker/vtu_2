import { Mail } from "lucide-react";
import { Link as RouterLink } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Card, inputCls } from "@/features/user/components/shared-ui";
import { AuthLayout } from "../components/AuthLayout";
import { forgotPasswordSchema, type ForgotPasswordFormData } from "../validators";

export default function ForgotPasswordPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isSubmitSuccessful },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async () => {
    await new Promise((resolve) => window.setTimeout(resolve, 450));
  };

  return (
    <AuthLayout>
      <Card className="rounded-lg border-white/70 bg-white/70 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur-xl sm:p-8">
        <div className="mb-6">
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-indigo-600">Account recovery</p>
          <h1 className="text-2xl font-semibold text-slate-950 tracking-tight">Reset your password</h1>
          <p className="text-slate-500 text-sm mt-1">Enter your email and we will prepare a secure reset link.</p>
        </div>

        {isSubmitSuccessful && (
          <div className="mb-4 rounded-xl border border-emerald-100 bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-700">
            Reset instructions are ready in this mock flow.
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                placeholder="you@email.com"
                {...register("email")}
                className={`${inputCls} pl-9 bg-white/80 ${errors.email ? "border-red-300" : ""}`}
              />
            </div>
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <Button type="submit" disabled={isSubmitting} loading={isSubmitting} fullWidth className="rounded-lg py-3">
            {isSubmitting ? "" : "Send reset link"}
          </Button>
        </form>
      </Card>

      <p className="text-center text-sm text-slate-500 mt-5">
        Remembered it?{" "}
        <RouterLink to="/login" className="text-indigo-600 font-medium hover:text-indigo-700">
          Sign in
        </RouterLink>
      </p>
    </AuthLayout>
  );
}
