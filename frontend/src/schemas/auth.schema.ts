import { z } from "zod";

export const loginSchema = z.object({
  email: z.email({ error: "El email no tiene un formato valido" }).trim().toLowerCase(),
  password: z.string().min(1, { error: "La contraseña es obligatoria" }),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Ingresá al menos 2 caracteres").max(80),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email({ error: "Ingresá un email válido" })),
  password: z.string().min(8, "Usá al menos 8 caracteres").max(128),
});

export type RegisterFormValues = z.infer<typeof registerSchema>;
