import { useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { Link as RouterLink } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Card, inputCls } from "@/features/user/components/shared-ui";
import { AuthLayout, authCardCls, authInputCls } from "../components/AuthLayout";
import { resetPasswordSchema, type ResetPasswordFormData } from "../validators";

export default function ResetPasswordPage() {
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isSubmitSuccessful },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async () => {
    await new Promise((resolve) => window.setTimeout(resolve, 450));
  };

  return (
    <AuthLayout>
      <Card className={authCardCls}>
        <div className="mb-7">
          <h1 className="text-2xl font-semibold text-slate-950 tracking-tight">Choose a new password</h1>
          <p className="text-slate-500 text-sm mt-1">Create a fresh password for your KORA account.</p>
        </div>

        {isSubmitSuccessful && (
          <div className="mb-4 rounded-xl border border-emerald-100 bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-700">
            Password updated in this mock flow.
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                {...register("password")}
                className={`${inputCls} ${authInputCls} pl-9 pr-10 ${errors.password ? "border-red-300" : ""}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Confirm password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Confirm password"
                {...register("confirmPassword")}
                className={`${inputCls} ${authInputCls} pl-9 ${errors.confirmPassword ? "border-red-300" : ""}`}
              />
            </div>
            {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
          </div>

          <Button type="submit" disabled={isSubmitting} loading={isSubmitting} fullWidth className="rounded-2xl py-4 shadow-lg shadow-indigo-600/25">
            {isSubmitting ? "" : "Update password"}
          </Button>
        </form>
      </Card>

      <p className="text-center text-sm text-slate-500 mt-5">
        Ready to continue?{" "}
        <RouterLink to="/login" className="text-indigo-600 font-medium hover:text-indigo-700">
          Sign in
        </RouterLink>
      </p>
    </AuthLayout>
  );
}
