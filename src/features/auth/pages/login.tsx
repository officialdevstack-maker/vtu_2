import { useEffect, useState } from "react";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Card } from "@/features/user/components/shared-ui";
import { useAuth, type User } from "@/shared/providers/auth";
import { useBranding } from "@/shared/branding";
import { useSeo } from "@/shared/seo";
import { AuthField, AuthLayout, authCardCls } from "../components/AuthLayout";
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
  const safeDestination = from?.startsWith("/") && !from.startsWith("//") && !from.startsWith("/login");
  return safeDestination && (isAdmin || !from.startsWith("/admin")) ? from : fallback;
}

function loginErrorMessage(error: unknown) {
  const response = (error as {
    response?: { data?: { message?: string; errors?: Record<string, string[]> } };
  })?.response;
  const loginError = response?.data?.errors?.login?.[0];

  return loginError ?? response?.data?.message ?? "Invalid credentials. Please try again.";
}

const LoginForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, login, user } = useAuth();
  const { app_name } = useBranding();
  useSeo({
    title: "Login",
    description: `Sign in to your ${app_name || "Vendify"} account to buy airtime, data and pay bills.`,
  });
  const stateDestination = (location.state as { from?: Location } | null)?.from?.pathname;
  const storedDestination = window.sessionStorage.getItem("vendify-intended-path") ?? undefined;
  const from = stateDestination ?? storedDestination;

  useEffect(() => {
    if (isAuthenticated) {
      navigate(resolveDestination(user, from), { replace: true });
    }
  }, [from, isAuthenticated, navigate, user]);

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
      const user = await login(data.login, data.password, data.rememberMe === true);
      window.sessionStorage.removeItem("vendify-intended-path");
      navigate(resolveDestination(user, from), { replace: true });
    } catch (error) {
      setError("root", { message: loginErrorMessage(error) });
    }
  };

  return (
    <AuthLayout>
      <Card className={authCardCls}>
        <div className="mb-8">
          <div className="mb-3 h-1 w-10 rounded-full bg-orange-500" />
          <h1 className="text-3xl font-bold text-slate-950 tracking-tight">Welcome back</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">Sign in securely to continue to your {app_name} wallet.</p>
        </div>

        {errors.root && (
          <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
            {errors.root.message}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <AuthField
            label="Email or phone number"
            icon={<Mail className="h-4 w-4" />}
            type="text"
            autoComplete="username"
            placeholder="you@email.com or 08012345678"
            error={errors.login?.message}
            {...register("login")}
          />

          <div>
            <AuthField
              label="Password"
              icon={<Lock className="h-4 w-4" />}
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Enter your password"
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
            <div className="mt-2 flex justify-end">
              <RouterLink to="/forgot-password" className="text-xs font-semibold text-slate-700 transition-colors hover:text-orange-600">Forgot password?</RouterLink>
            </div>
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
            className="rounded-2xl bg-slate-950 py-4 shadow-[0_12px_28px_-12px_rgba(15,23,42,0.65)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-800 active:translate-y-0 active:scale-[0.99]"
          >
            {isSubmitting ? "" : "Sign in"}
          </Button>
        </form>
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
