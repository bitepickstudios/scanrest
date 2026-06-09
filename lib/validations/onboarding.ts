import { z } from "zod";

export const step1Schema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nombre muy corto (mínimo 2 letras)")
    .max(60, "Máximo 60 caracteres"),
  slug: z
    .string()
    .trim()
    .min(2, "URL muy corta")
    .regex(/^[a-z0-9-]+$/, "Solo letras, números y guiones"),
  description: z
    .string()
    .max(240, "Máximo 240 caracteres")
    .optional()
    .or(z.literal("")),
});

export const step2Schema = z.object({
  mode: z.enum(["table", "foodcourt"], {
    message: "Elegí cómo entregás los pedidos",
  }),
  address: z.string().trim().min(3, "Dirección muy corta"),
  phone: z.string().trim().min(3, "Teléfono muy corto"),
});

export const step3Schema = z.object({
  whatsapp: z.string().trim().optional().or(z.literal("")),
  instagram: z.string().trim().optional().or(z.literal("")),
  facebook: z.string().trim().optional().or(z.literal("")),
  tiktok: z.string().trim().optional().or(z.literal("")),
});

export type Step1Data = z.infer<typeof step1Schema>;
export type Step2Data = z.infer<typeof step2Schema>;
export type Step3Data = z.infer<typeof step3Schema>;
