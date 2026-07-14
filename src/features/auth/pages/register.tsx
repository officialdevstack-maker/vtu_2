import { useState } from "react";
import axios from "axios";
import { Eye, EyeOff, Gift, Lock, Mail, Phone, User } from "lucide-react";
import { Link as RouterLink, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Card, inputCls } from "@/features/user/components/shared-ui";
import { useAuth } from "@/shared/providers/auth";
import { useBranding } from "@/shared/branding";
import { useSeo } from "@/shared/seo";
import { AuthLayout, authCardCls, authInputCls } from "../components/AuthLayout";
import { registerSchema, type RegisterFormData } from "../validators";

// Every backend failure here is either a validation-shaped 4xx or the
// generic `fail()` 500 wrapper — both put a human-readable string at
// response.data.message once unwrapped through the (single) envelope.
function extractErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as
      | { message?: string; errors?: Record<string, string[]> }
      | undefined;
    const validationErrors = data?.errors;
    if (validationErrors && Object.keys(validationErrors).length > 0) {
      return Object.values(validationErrors).flat().join(" ");
    }
    if (typeof data?.message === "string") return data.message;
  }
  return "Could not create account. Please try again.";
}

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const { app_name } = useBranding();
  useSeo({
    title: "Create your account",
    description: `Create a free ${app_name || "Vendify"} account to buy airtime and data at a discount, and pay electricity, cable TV and exam bills instantly.`,
  });
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const referralCode = searchParams.get("ref")?.trim().toUpperCase() || undefined;
  const { register: registerAccount } = useAuth();

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
      await registerAccount({
        fullname: data.fullname,
        username: data.username,
        email: data.email,
        phone: data.phone,
        password: data.password,
        password_confirmation: data.confirmPassword,
        referral_code: referralCode,
      });
      navigate("/create-transaction-pin", { replace: true });
    } catch (err) {
      setError("root", { message: extractErrorMessage(err) });
    }
  };

  return (
    <AuthLayout>
      <Card className={authCardCls}>
        <div className="mb-7">
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

        {referralCode && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-700">
            <Gift className="w-4 h-4 shrink-0" />
            Referred by <span className="font-mono font-semibold">{referralCode}</span>
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
                className={`${inputCls} ${authInputCls} pl-9 ${errors.fullname ? "border-red-300" : ""}`}
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
                className={`${inputCls} ${authInputCls} pl-9 ${errors.username ? "border-red-300" : ""}`}
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
                className={`${inputCls} ${authInputCls} pl-9 ${errors.email ? "border-red-300" : ""}`}
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
                className={`${inputCls} ${authInputCls} pl-9 ${errors.phone ? "border-red-300" : ""}`}
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
            {errors.confirmPassword && (
              <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>
            )}
          </div>

          <div className="flex items-start gap-2">
            <input
              type="checkbox"
              id="acceptTerms"
              {...register("acceptTerms")}
              className="w-3.5 h-3.5 mt-0.5 rounded border-gray-300 accent-[#111827] focus:ring-[#111827]/30 cursor-pointer"
            />
            <label htmlFor="acceptTerms" className="text-sm text-slate-600 cursor-pointer select-none">
              I agree to the{" "}
              <a href="#" className="text-[#111827] font-medium hover:opacity-80">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#" className="text-[#111827] font-medium hover:opacity-80">
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
            className="rounded-2xl bg-[#111827] py-4 shadow-lg shadow-[#111827]/20 hover:bg-[#111827] hover:opacity-95"
          >
            {isSubmitting ? "" : "Continue to PIN setup"}
          </Button>
        </form>
      </Card>

      <p className="text-center text-sm text-slate-500 mt-5">
        Already have an account?{" "}
        <RouterLink to="/login" className="text-[#111827] font-medium hover:opacity-80">
          Sign in
        </RouterLink>
      </p>
    </AuthLayout>
  );
}
