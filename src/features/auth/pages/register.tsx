import { useState } from "react";
import axios from "axios";
import { Eye, EyeOff, Gift, Lock, Mail, Phone, User } from "lucide-react";
import { Link as RouterLink, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Card } from "@/features/user/components/shared-ui";
import { useAuth } from "@/shared/providers/auth";
import { useBranding } from "@/shared/branding";
import { useSeo } from "@/shared/seo";
import { AuthField, AuthLayout, authCardCls } from "../components/AuthLayout";
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
        <div className="mb-8">
          <div className="mb-3 h-1 w-10 rounded-full bg-orange-500" />
          <h1 className="text-3xl font-bold text-slate-950 tracking-tight">Create your account</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            Join {app_name} — it only takes a minute. Your secure transaction PIN comes next.
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

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <AuthField label="Full name" icon={<User className="h-4 w-4" />} type="text" autoComplete="name" placeholder="Emeka Obi" error={errors.fullname?.message} {...register("fullname")} />
          <AuthField label="Username" icon={<User className="h-4 w-4" />} type="text" autoComplete="username" placeholder="emekaobi" error={errors.username?.message} {...register("username")} />
          <AuthField className="sm:col-span-2" label="Email address" icon={<Mail className="h-4 w-4" />} type="email" autoComplete="email" placeholder="you@email.com" error={errors.email?.message} {...register("email")} />
          <AuthField className="sm:col-span-2" label="Phone number" icon={<Phone className="h-4 w-4" />} type="tel" autoComplete="tel" inputMode="tel" placeholder="08012345678" error={errors.phone?.message} {...register("phone")} />

          <AuthField
            label="Password"
            icon={<Lock className="h-4 w-4" />}
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Create a strong password"
            error={errors.password?.message}
            {...register("password")}
            action={<button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>}
          />
          <AuthField label="Confirm password" icon={<Lock className="h-4 w-4" />} type={showPassword ? "text" : "password"} autoComplete="new-password" placeholder="Repeat password" error={errors.confirmPassword?.message} {...register("confirmPassword")} />

          <div className="flex items-start gap-2 sm:col-span-2">
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
            <p className="text-red-500 text-xs -mt-2 sm:col-span-2">{errors.acceptTerms.message}</p>
          )}

          <Button
            type="submit"
            disabled={isSubmitting}
            loading={isSubmitting}
            fullWidth
            className="rounded-2xl bg-slate-950 py-4 shadow-[0_12px_28px_-12px_rgba(15,23,42,0.65)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-800 active:translate-y-0 active:scale-[0.99] sm:col-span-2"
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
