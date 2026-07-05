import { z } from "zod";

export const loginSchema = z.object({
  login: z
    .string()
    .min(1, { message: "Email or phone number is required" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters long" }),
  rememberMe: z.boolean().optional(),
});

// 2. Infer TypeScript type from the Zod schema
export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    fullname: z.string().min(2, { message: "Full name is required" }),
    username: z
      .string()
      .min(3, { message: "Username must be at least 3 characters" })
      .regex(/^[a-zA-Z0-9_]+$/, { message: "Username can only contain letters, numbers and underscores" }),
    email: z.string().email({ message: "Enter a valid email address" }),
    phone: z
      .string()
      .regex(/^0\d{10}$/, { message: "Enter a valid 11-digit phone number" }),
    password: z.string().min(6, { message: "Password must be at least 6 characters" }),
    confirmPassword: z.string().min(1, { message: "Please confirm your password" }),
    acceptTerms: z.literal(true, { message: "You must accept the terms" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;

export const transactionPinSchema = z
  .object({
    pin: z
      .string()
      .regex(/^\d+$/, { message: "PIN must contain numbers only" })
      .length(4, { message: "PIN must be exactly 4 digits" }),
    confirmPin: z.string().min(1, { message: "Please confirm your PIN" }),
  })
  .refine((data) => data.pin === data.confirmPin, {
    message: "PINs do not match",
    path: ["confirmPin"],
  });

export type TransactionPinFormData = z.infer<typeof transactionPinSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Enter a valid email address" }),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: z.string().min(6, { message: "Password must be at least 6 characters" }),
    confirmPassword: z.string().min(1, { message: "Please confirm your password" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
