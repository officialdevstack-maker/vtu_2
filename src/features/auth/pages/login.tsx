import { useState } from "react";
import { Eye, EyeOff, Lock, Mail, ShieldCheck, UserRound } from "lucide-react";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Card, inputCls } from "@/features/user/components/shared-ui";
import { useAuth, type User } from "@/shared/providers/auth";
import { useBranding } from "@/shared/branding";
import { AuthLayout, authCardCls, authInputCls } from "../components/AuthLayout";
import { loginSchema, type LoginFormData } from "../validators";

// A transaction PIN guards wallet actions, so any non-admin user without one
// is sent to set it up before they can reach anywhere else — this always
// wins over the "return to where you came from" redirect below. Admins are
// exempt: the PIN concept only applies to the customer wallet flow.
function resolveDestination(user: User | null, from?: string) {
  if (!user) return "/login";
  const isAdmin = user.user_type === "admin";
  if (!isAdmin && !user.has_pin) return "/create-transaction-pin";
  const fallback = isAdmin ? "/admin" : "/dashboard";
  return from && (isAdmin || !from.startsWith("/admin")) ? from : fallback;
}

const LoginForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [demoLoading, setDemoLoading] = useState<"user" | "admin" | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { login, demoLogin } = useAuth();
  const { app_name } = useBranding();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      const user = await login(data.login, data.password);
      const from = (location.state as { from?: Location } | null)?.from?.pathname;
      navigate(resolveDestination(user, from), { replace: true });
    } catch {
      setError("root", { message: "Invalid credentials. Please try again." });
    }
  };

  const handleDemoAccess = async (type: "user" | "admin") => {
    setDemoLoading(type);
    try {
      const user = await demoLogin(type);
      const from = (location.state as { from?: Location } | null)?.from?.pathname;
      navigate(resolveDestination(user, from), { replace: true });
    } finally {
      setDemoLoading(null);
    }
  };

  return (
    <AuthLayout>
      <Card className={authCardCls}>
        <div className="mb-7">
          <h1 className="text-2xl font-semibold text-slate-950 tracking-tight">Welcome back</h1>
          <p className="text-slate-500 text-sm mt-1">Sign in to continue to your {app_name} wallet.</p>
        </div>

        {errors.root && (
          <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
            {errors.root.message}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              Email or phone number
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="you@email.com or 08012345678"
                {...register("login")}
                className={`${inputCls} ${authInputCls} pl-9 ${errors.login ? "border-red-300" : ""}`}
              />
            </div>
            {errors.login && <p className="text-red-500 text-xs mt-1">{errors.login.message}</p>}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-slate-600">Password</label>
              <RouterLink to="/forgot-password" className="text-xs text-[#111827] font-medium hover:opacity-80">
                Forgot password?
              </RouterLink>
            </div>
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

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="remember"
              {...register("rememberMe")}
              className="w-3.5 h-3.5 rounded border-gray-300 accent-[#111827] focus:ring-[#111827]/30 cursor-pointer"
            />
            <label htmlFor="remember" className="text-sm text-slate-600 cursor-pointer select-none">
              Remember me for 30 days
            </label>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            loading={isSubmitting}
            fullWidth
            className="rounded-2xl bg-[#111827] py-4 shadow-lg shadow-[#111827]/20 hover:bg-[#111827] hover:opacity-95"
          >
            {isSubmitting ? "" : "Sign in"}
          </Button>
        </form>

        <div className="mt-5">
          <div className="relative flex items-center">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="px-3 text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
              Demo access
            </span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => void handleDemoAccess("user")}
              disabled={Boolean(demoLoading) || isSubmitting}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <UserRound className="h-4 w-4" />
              {demoLoading === "user" ? "Opening..." : "Demo User"}
            </button>
            <button
              type="button"
              onClick={() => void handleDemoAccess("admin")}
              disabled={Boolean(demoLoading) || isSubmitting}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-[#111827] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#111827] hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <ShieldCheck className="h-4 w-4" />
              {demoLoading === "admin" ? "Opening..." : "Demo Admin"}
            </button>
          </div>
        </div>
      </Card>

      <p className="text-center text-sm text-slate-500 mt-5">
        Don't have an account?{" "}
        <RouterLink to="/register" className="text-[#111827] font-medium hover:opacity-80">
          Create one
        </RouterLink>
      </p>
    </AuthLayout>
  );
};

export default LoginForm;
