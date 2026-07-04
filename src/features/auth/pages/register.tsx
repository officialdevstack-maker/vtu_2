import { useState } from "react";
import { Eye, EyeOff, Zap } from "lucide-react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterFormData } from "../validators";
import { apiClient } from "@/shared/api/apiClient";

const inputCls =
  "w-full px-3.5 py-2.5 rounded-lg border bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition";

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
      await apiClient.post('/register', {
        fullname: data.fullname,
        username: data.username,
        email: data.email,
        phone: data.phone,
        pin: data.pin,
        password: data.password,
      });
      navigate('/login', { replace: true });
    } catch (error: any) {
      setError('root', {
        message:
          error?.response?.data?.message || 'Could not create account. Please try again.',
      });
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
              <h1 className="text-lg font-semibold text-slate-900">Create an account</h1>
              <p className="text-slate-500 text-sm mt-0.5">Start using KORA to manage airtime, data and bills</p>
            </div>

            {errors.root && (
              <div className="mb-4 bg-red-50 border border-red-100 rounded-lg px-3.5 py-2.5 text-red-700 text-sm">
                {errors.root.message}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Full name</label>
                <input
                  type="text"
                  placeholder="Emeka Obi"
                  {...register('fullname')}
                  className={`${inputCls} ${errors.fullname ? 'border-red-300' : 'border-gray-300'}`}
                />
                {errors.fullname && <p className="text-red-500 text-xs mt-1">{errors.fullname.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Username</label>
                <input
                  type="text"
                  placeholder="emekaobi"
                  {...register('username')}
                  className={`${inputCls} ${errors.username ? 'border-red-300' : 'border-gray-300'}`}
                />
                {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Email</label>
                <input
                  type="email"
                  placeholder="you@email.com"
                  {...register('email')}
                  className={`${inputCls} ${errors.email ? 'border-red-300' : 'border-gray-300'}`}
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Phone number</label>
                <input
                  type="tel"
                  placeholder="08012345678"
                  {...register('phone')}
                  className={`${inputCls} ${errors.phone ? 'border-red-300' : 'border-gray-300'}`}
                />
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Transaction PIN</label>
                <input
                  type="text"
                  maxLength={4}
                  placeholder="1234"
                  {...register('pin')}
                  className={`${inputCls} ${errors.pin ? 'border-red-300' : 'border-gray-300'}`}
                />
                {errors.pin && <p className="text-red-500 text-xs mt-1">{errors.pin.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    {...register('password')}
                    className={`${inputCls} pr-10 ${errors.password ? 'border-red-300' : 'border-gray-300'}`}
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

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Confirm password</label>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  {...register("confirmPassword")}
                  className={`${inputCls} ${errors.confirmPassword ? "border-red-300" : "border-gray-300"}`}
                />
                {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
              </div>

              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="acceptTerms"
                  {...register("acceptTerms")}
                  className="w-3.5 h-3.5 mt-0.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500/30 cursor-pointer"
                />
                <label htmlFor="acceptTerms" className="text-sm text-slate-600 cursor-pointer select-none">
                  I agree to the <a href="#" className="text-indigo-600 font-medium hover:text-indigo-700">Terms of Service</a> and{" "}
                  <a href="#" className="text-indigo-600 font-medium hover:text-indigo-700">Privacy Policy</a>
                </label>
              </div>
              {errors.acceptTerms && <p className="text-red-500 text-xs -mt-2">{errors.acceptTerms.message}</p>}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
              >
                {isSubmitting ? "Creating account..." : "Create account"}
              </button>
            </form>
          </div>

          <p className="text-center text-sm text-slate-500 mt-5">
            Already have an account?{" "}
            <RouterLink to="/login" className="text-indigo-600 font-medium hover:text-indigo-700">
              Sign in
            </RouterLink>
          </p>
        </div>
      </div>
    </div>
  );
}
