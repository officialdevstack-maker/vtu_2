import { useState } from "react";
import { Eye, EyeOff, Lock, Mail, Phone, User } from "lucide-react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Card, inputCls } from "@/features/user/components/shared-ui";
import { AuthLayout } from "../components/AuthLayout";
import { createMockAccount } from "../mockSession";
import { registerSchema, type RegisterFormData } from "../validators";

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await new Promise((resolve) => window.setTimeout(resolve, 500));
      createMockAccount(data);
      navigate("/create-transaction-pin", { replace: true });
    } catch {
      setError("root", {
        message: "Could not create account. Please try again.",
      });
    }
  };

  return (
    <AuthLayout>
      <Card className="rounded-lg border-white/70 bg-white/70 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur-xl sm:p-8">
        <div className="mb-6">
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-indigo-600">Start with KORA</p>
          <h1 className="text-2xl font-semibold text-slate-950 tracking-tight">Create an account</h1>
          <p className="text-slate-500 text-sm mt-1">
            Set up your profile first. Your transaction PIN comes next.
          </p>
        </div>

        {errors.root && (
          <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
            {errors.root.message}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Full name</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Emeka Obi"
                {...register("fullname")}
                className={`${inputCls} pl-9 bg-white/80 ${errors.fullname ? "border-red-300" : ""}`}
              />
            </div>
            {errors.fullname && <p className="text-red-500 text-xs mt-1">{errors.fullname.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Username</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="emekaobi"
                {...register("username")}
                className={`${inputCls} pl-9 bg-white/80 ${errors.username ? "border-red-300" : ""}`}
              />
            </div>
            {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username.message}</p>}
          </div>

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

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Phone number</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                placeholder="08012345678"
                {...register("phone")}
                className={`${inputCls} pl-9 bg-white/80 ${errors.phone ? "border-red-300" : ""}`}
              />
            </div>
            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                {...register("password")}
                className={`${inputCls} pl-9 pr-10 bg-white/80 ${errors.password ? "border-red-300" : ""}`}
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
                className={`${inputCls} pl-9 bg-white/80 ${errors.confirmPassword ? "border-red-300" : ""}`}
              />
            </div>
            {errors.confirmPassword && (
              <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>
            )}
          </div>

          <div className="flex items-start gap-2">
            <input
              type="checkbox"
              id="acceptTerms"
              {...register("acceptTerms")}
              className="w-3.5 h-3.5 mt-0.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500/30 cursor-pointer"
            />
            <label htmlFor="acceptTerms" className="text-sm text-slate-600 cursor-pointer select-none">
              I agree to the{" "}
              <a href="#" className="text-indigo-600 font-medium hover:text-indigo-700">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#" className="text-indigo-600 font-medium hover:text-indigo-700">
                Privacy Policy
              </a>
            </label>
          </div>
          {errors.acceptTerms && (
            <p className="text-red-500 text-xs -mt-2">{errors.acceptTerms.message}</p>
          )}

          <Button
            type="submit"
            disabled={isSubmitting}
            loading={isSubmitting}
            fullWidth
            className="rounded-lg py-3 shadow-sm shadow-indigo-600/10"
          >
            {isSubmitting ? "" : "Continue to PIN setup"}
          </Button>
        </form>
      </Card>

      <p className="text-center text-sm text-slate-500 mt-5">
        Already have an account?{" "}
        <RouterLink to="/login" className="text-indigo-600 font-medium hover:text-indigo-700">
          Sign in
        </RouterLink>
      </p>
    </AuthLayout>
  );
}
