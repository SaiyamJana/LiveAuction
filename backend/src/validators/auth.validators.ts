import { z } from "zod";

const email = z.string().trim().toLowerCase().email("Enter a valid email address").max(254, "Email is too long");

// bcrypt only uses the first 72 bytes, so longer values are rejected instead of silently truncated.
const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be at most 72 characters");

const secureCode = z
  .string()
  .min(6, "Secure code must be at least 6 characters")
  .max(64, "Secure code must be at most 64 characters");

// z.object() drops unknown keys, so a client-supplied "role" never reaches the controller.
export const registerSchema = z
  .object({
    username: z.string().trim().min(2, "Username must be at least 2 characters").max(50, "Username must be at most 50 characters"),
    email,
    password,
    confirmPassword: z.string().min(1, "Please confirm your password"),
    secureCode,
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((d) => d.secureCode !== d.password, {
    message: "Secure code must be different from your password",
    path: ["secureCode"],
  });

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Password is required").max(200, "Password is too long"),
});

export const resetPasswordSchema = z.object({
  email,
  secureCode: z.string().min(1, "Secure code is required").max(64, "Secure code is too long"),
  newPassword: password,
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required").max(200),
    newPassword: password,
  })
  .refine((d) => d.currentPassword !== d.newPassword, {
    message: "New password must be different from the current password",
    path: ["newPassword"],
  });

export const deleteAccountSchema = z.object({
  secureCode: z.string().min(1, "Secure code is required").max(64),
  confirmation: z.literal("DELETE", { message: 'Type "DELETE" to confirm' }),
});

export type RegisterBody = z.infer<typeof registerSchema>;
export type LoginBody = z.infer<typeof loginSchema>;
export type ResetPasswordBody = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordBody = z.infer<typeof changePasswordSchema>;
export type DeleteAccountBody = z.infer<typeof deleteAccountSchema>;