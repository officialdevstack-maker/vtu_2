import { useState } from "react";
import { Eye, EyeOff, Zap } from "lucide-react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginFormData } from "../validators";
import { useAuth } from "@/shared/providers/auth";

const inputCls =
  "w-full px-3.5 py-2.5 rounded-lg border bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition";

const LoginForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

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
      await login(data.login, data.password);
      navigate("/dashboard", { replace: true });
    } catch {
      setError("root", { message: "Invalid credentials. Please try again." });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="pt-10 flex justify-center">
        <RouterLink to="/" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-indigo-600 rounded-md flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-slate-900">KORA</span>
        </RouterLink>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm">
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="mb-6">
              <h1 className="text-lg font-semibold text-slate-900">Sign in</h1>
              <p className="text-slate-500 text-sm mt-0.5">Enter your details to access your account</p>
            </div>

            {errors.root && (
              <div className="mb-4 bg-red-50 border border-red-100 rounded-lg px-3.5 py-2.5 text-red-700 text-sm">
                {errors.root.message}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Email or phone number
                </label>
                <input
                  type="text"
                  placeholder="you@email.com or 08012345678"
                  {...register("login")}
                  className={`${inputCls} ${errors.login ? "border-red-300" : "border-gray-300"}`}
                />
                {errors.login && <p className="text-red-500 text-xs mt-1">{errors.login.message}</p>}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-slate-600">Password</label>
                  <RouterLink to="/forgot-password" className="text-xs text-indigo-600 font-medium hover:text-indigo-700">
                    Forgot password?
                  </RouterLink>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    {...register("password")}
                    className={`${inputCls} pr-10 ${errors.password ? "border-red-300" : "border-gray-300"}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
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
                  className="w-3.5 h-3.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500/30 cursor-pointer"
                />
                <label htmlFor="remember" className="text-sm text-slate-600 cursor-pointer select-none">
                  Remember me for 30 days
                </label>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-medium py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
              >
                {isSubmitting ? "Signing in..." : "Sign in"}
              </button>
            </form>
          </div>

          <p className="text-center text-sm text-slate-500 mt-5">
            Don't have an account?{" "}
            <RouterLink to="/register" className="text-indigo-600 font-medium hover:text-indigo-700">
              Create one
            </RouterLink>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
