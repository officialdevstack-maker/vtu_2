import { useState } from "react";
import { Mail } from "lucide-react";
import { Link as RouterLink } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Card, inputCls } from "@/features/user/components/shared-ui";
import { AuthLayout, authCardCls, authInputCls } from "../components/AuthLayout";
import { authService } from "../authService";
import { forgotPasswordSchema, type ForgotPasswordFormData } from "../validators";

export default function ForgotPasswordPage() {
  const [success, setSuccess] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    // The backend always reports success here regardless of whether the
    // email is registered, so the only failure case left is a genuine
    // network/server error — this can't be used to enumerate accounts.
    try {
      await authService.forgotPassword(data.email);
      setSuccess(true);
    } catch {
      setError("root", { message: "We could not send the email. Please try again." });
    }
  };

  return (
    <AuthLayout>
      <Card className={authCardCls}>
        <div className="mb-7">
          <h1 className="text-2xl font-semibold text-slate-950 tracking-tight">Reset your password</h1>
          <p className="text-slate-500 text-sm mt-1">Enter your email and we will prepare a secure reset link.</p>
        </div>

        {errors.root && (
          <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
            {errors.root.message}
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-xl border border-emerald-100 bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-700">
            Password reset link sent. Check your inbox for the secure reset link.
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
                className={`${inputCls} ${authInputCls} pl-9 ${errors.email ? "border-red-300" : ""}`}
              />
            </div>
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <Button type="submit" disabled={isSubmitting} loading={isSubmitting} fullWidth className="rounded-2xl bg-[#111827] py-4 shadow-lg shadow-[#111827]/20 hover:bg-[#111827] hover:opacity-95">
            {isSubmitting ? "" : "Send reset link"}
          </Button>
        </form>
      </Card>

      <p className="text-center text-sm text-slate-500 mt-5">
        Remembered it?{" "}
        <RouterLink to="/login" className="text-[#111827] font-medium hover:opacity-80">
          Sign in
        </RouterLink>
      </p>
    </AuthLayout>
  );
}
