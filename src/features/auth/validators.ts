import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

export const loginSchema = z.object({
  emailOrPhone: z
    .string()
    .min(1, { message: "Email or phone number is required" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters long" }),
  rememberMe: z.boolean().optional(),
});

// 2. Infer TypeScript type from the Zod schema
export type LoginFormData = z.infer<typeof loginSchema>;