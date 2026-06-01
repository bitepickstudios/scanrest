"use client";

import { useState, useTransition } from "react";
import {
  Button,
  Label,
  Radio,
  RadioGroup,
} from "@heroui/react";
import { updateRestaurantProfile } from "@/lib/actions/restaurant";
import PhoneMockup from "@/components/admin/PhoneMockup";
import type {
  MenuLayout,
  MenuRounded,
  Restaurant,
  RestaurantTheme,
} from "@/lib/types";

const LAYOUT_OPTIONS: { value: MenuLayout; label: string; hint: string }[] = [
  { value: "list", label: "Lista", hint: "Una columna, foto al costado" },
  { value: "grid", label: "Grilla", hint: "Dos columnas con foto arriba" },
  { value: "columns", label: "Mosaico", hint: "Dos columnas tipo Pinterest" },
];

const ROUNDED_OPTIONS: { value: MenuRounded; label: string }[] = [
  { value: "sm", label: "Sutil" },
  { value: "md", label: "Medio" },
  { value: "lg", label: "Pronunciado" },
  { value: "full", label: "Muy redondeado" },
];

const DEFAULT_ACCENT = "#9bd7a8";

export default function PersonalizationForm({
  restaurant,
  branchSlug,
}: {
  restaurant: Restaurant;
  branchSlug: string | null;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [theme, setTheme] = useState<RestaurantTheme>(restaurant.theme ?? "light");
  const [layout, setLayout] = useState<MenuLayout>(restaurant.menu_layout ?? "list");
  const [rounded, setRounded] = useState<MenuRounded>(restaurant.menu_rounded ?? "md");
  const [accent, setAccent] = useState<string>(restaurant.accent_color ?? DEFAULT_ACCENT);
  const [useCustomAccent, setUseCustomAccent] = useState<boolean>(
    !!restaurant.accent_color
  );

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    const data = new FormData();
    data.set("theme", theme);
    data.set("menu_layout", layout);
    data.set("menu_rounded", rounded);
    data.set("accent_color", useCustomAccent ? accent : "");

    startTransition(async () => {
      try {
        await updateRestaurantProfile(data);
        setSuccess(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al guardar");
      }
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_minmax(320px,360px)]">
      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-xl border border-neutral-200 bg-white p-6"
      >
        <RadioGroup
          value={theme}
          onChange={(v) => setTheme(v as RestaurantTheme)}
          orientation="horizontal"
        >
          <Label>Tema</Label>
          <Radio value="light">
            <Radio.Control>
              <Radio.Indicator />
            </Radio.Control>
            <Radio.Content>
              <Label>Claro</Label>
            </Radio.Content>
          </Radio>
          <Radio value="dark">
            <Radio.Control>
              <Radio.Indicator />
            </Radio.Control>
            <Radio.Content>
              <Label>Oscuro</Label>
            </Radio.Content>
          </Radio>
        </RadioGroup>

        <RadioGroup
          value={layout}
          onChange={(v) => setLayout(v as MenuLayout)}
        >
          <Label>Distribución del menú</Label>
          <div className="grid gap-2">
            {LAYOUT_OPTIONS.map((opt) => (
              <Radio key={opt.value} value={opt.value}>
                <Radio.Control>
                  <Radio.Indicator />
                </Radio.Control>
                <Radio.Content>
                  <Label>{opt.label}</Label>
                  <p className="text-xs text-neutral-500">{opt.hint}</p>
                </Radio.Content>
              </Radio>
            ))}
          </div>
        </RadioGroup>

        <RadioGroup
          value={rounded}
          onChange={(v) => setRounded(v as MenuRounded)}
          orientation="horizontal"
        >
          <Label>Bordes</Label>
          {ROUNDED_OPTIONS.map((opt) => (
            <Radio key={opt.value} value={opt.value}>
              <Radio.Control>
                <Radio.Indicator />
              </Radio.Control>
              <Radio.Content>
                <Label>{opt.label}</Label>
              </Radio.Content>
            </Radio>
          ))}
        </RadioGroup>

        <div className="flex flex-col gap-2">
          <Label>Color de acento</Label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={accent}
              onChange={(e) => {
                setAccent(e.target.value);
                setUseCustomAccent(true);
              }}
              className="h-10 w-14 cursor-pointer rounded-lg border border-neutral-200 bg-white"
            />
            <input
              type="text"
              value={accent}
              onChange={(e) => {
                setAccent(e.target.value);
                setUseCustomAccent(true);
              }}
              className="w-32 rounded-lg border border-neutral-200 px-3 py-2 font-mono text-sm"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onPress={() => setUseCustomAccent(false)}
              isDisabled={!useCustomAccent}
            >
              Usar default
            </Button>
          </div>
          {!useCustomAccent && (
            <p className="text-xs text-neutral-500">
              Usando el color por defecto del sistema.
            </p>
          )}
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}
        {success && (
          <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-600">
            Guardado correctamente
          </p>
        )}

        <Button type="submit" variant="primary" size="md" isPending={isPending}>
          {isPending ? "Guardando..." : "Guardar cambios"}
        </Button>
      </form>

      {branchSlug ? (
        <PhoneMockup
          slug={restaurant.slug}
          branchSlug={branchSlug}
          previewParams={{
            theme,
            layout,
            rounded,
            accent: useCustomAccent ? accent : null,
          }}
        />
      ) : (
        <div className="rounded-xl border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-500">
          Creá una sucursal para ver la vista previa.
        </div>
      )}
    </div>
  );
}
