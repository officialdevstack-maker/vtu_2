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
    name: z.string().min(2, { message: "Name is required" }),
    login: z.string().min(1, { message: "Email or phone is required" }),
    password: z.string().min(6, { message: "Password must be at least 6 characters" }),
    confirmPassword: z.string().min(1, { message: "Please confirm your password" }),
    acceptTerms: z.literal(true, { message: "You must accept the terms" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;