import { useState } from "react";
import { Eye, EyeOff, Zap, Shield, Activity, Users, Lock, Mail } from "lucide-react";
import { Link as RouterLink } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginFormData } from "../validators";
import { useAuth } from "@/shared/providers/auth";
import { useNavigate } from "react-router-dom";

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
    <div className="min-h-screen flex bg-app-bg">
      {/* Left brand panel */}
      <div className="hidden lg:flex lg:w-[480px] flex-col justify-between p-12 relative overflow-hidden shrink-0 bg-brand-gradient-dark">
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/5" />
        <div className="absolute top-1/3 left-20 w-48 h-48 rounded-full bg-white/5" />
        <div className="absolute -bottom-10 -left-10 w-56 h-56 rounded-full bg-white/5" />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-11 h-11 bg-indigo-500 rounded-2xl flex items-center justify-center shadow-lg">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-white font-black text-xl tracking-tight leading-tight">KORA</p>
              <p className="text-indigo-300 text-xs font-semibold">VTU Platform</p>
            </div>
          </div>

          <h1 className="text-4xl font-black text-white leading-tight mb-4">
            Nigeria's Most<br />Reliable VTU<br />Platform
          </h1>
          <p className="text-indigo-200 text-base leading-relaxed mb-10 max-w-[300px]">
            Buy airtime, data, pay electricity bills, cable TV subscriptions and more \u2014 instantly and securely.
          </p>

          <div className="space-y-3">
            {[
              { icon: Shield, text: "Bank-grade encryption on every transaction" },
              { icon: Activity, text: "99.9% uptime \u2014 always available when you need it" },
              { icon: Users, text: "Trusted by 150,000+ Nigerians nationwide" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 text-indigo-200 text-sm">
                <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-indigo-300" />
                </div>
                {text}
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="relative z-10 grid grid-cols-3 gap-3">
          {[["150K+", "Customers"], ["99.9%", "Uptime"], ["24/7", "Support"]].map(([val, label]) => (
            <div key={label} className="bg-white/10 rounded-2xl p-4 border border-white/10 text-center">
              <p className="text-white font-black text-xl">{val}</p>
              <p className="text-indigo-300 text-xs mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-black text-gray-900 text-lg">KORA</span>
          </div>

          <div className="bg-white rounded-3xl shadow-xl shadow-indigo-100/50 p-8 border border-gray-100">
            <div className="mb-7">
              <h2 className="text-2xl font-black text-gray-900 mb-1">Welcome back</h2>
              <p className="text-gray-400 text-sm">Sign in to your KORA account to continue</p>
            </div>

            {errors.root && (
              <div className="mb-5 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm font-medium">
                {errors.root.message}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
              {/* Email/Phone */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
                  Email or Phone Number
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="you@email.com or 08012345678"
                    {...register("login")}
                    className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition bg-gray-50 focus:bg-white ${errors.login ? "border-red-300 bg-red-50" : "border-gray-200"}`}
                  />
                </div>
                {errors.login && <p className="text-red-500 text-xs mt-1">{errors.login.message}</p>}
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Password</label>
                  <RouterLink to="/forgot-password" className="text-xs text-indigo-600 font-semibold hover:text-indigo-700">
                    Forgot password?
                  </RouterLink>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"
                    {...register("password")}
                    className={`w-full pl-10 pr-11 py-3 rounded-xl border text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition bg-gray-50 focus:bg-white ${errors.password ? "border-red-300 bg-red-50" : "border-gray-200"}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
              </div>

              {/* Remember me */}
              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  id="remember"
                  {...register("rememberMe")}
                  className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-400 cursor-pointer"
                />
                <label htmlFor="remember" className="text-sm text-gray-600 cursor-pointer select-none">
                  Remember me for 30 days
                </label>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl text-sm transition shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Signing in...
                  </>
                ) : "Sign In to Account"}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-6">
              Don't have an account?{" "}
              <RouterLink to="/register" className="text-indigo-600 font-bold hover:text-indigo-700">
                Create account
              </RouterLink>
            </p>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            By signing in, you agree to our{" "}
            <a href="#" className="text-indigo-500 hover:underline">Terms of Service</a> and{" "}
            <a href="#" className="text-indigo-500 hover:underline">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
