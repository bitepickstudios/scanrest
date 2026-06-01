"use client";

import { useMemo } from "react";

export type PreviewParams = {
  theme?: string;
  layout?: string;
  rounded?: string;
  accent?: string | null;
};

export default function PhoneMockup({
  slug,
  branchSlug,
  previewParams,
  className,
}: {
  slug: string;
  branchSlug: string;
  previewParams?: PreviewParams;
  className?: string;
}) {
  const src = useMemo(() => {
    const base = `/${slug}/${branchSlug}`;
    if (!previewParams) return base;
    const sp = new URLSearchParams();
    if (previewParams.theme) sp.set("_t", previewParams.theme);
    if (previewParams.layout) sp.set("_l", previewParams.layout);
    if (previewParams.rounded) sp.set("_r", previewParams.rounded);
    if (previewParams.accent) sp.set("_a", previewParams.accent);
    const qs = sp.toString();
    return qs ? `${base}?${qs}` : base;
  }, [slug, branchSlug, previewParams]);

  return (
    <div className={`sticky top-6 flex justify-center ${className ?? ""}`}>
      <div className="relative w-[300px] rounded-[2.5rem] border-[10px] border-neutral-900 bg-neutral-900 shadow-2xl">
        <div className="absolute left-1/2 top-1.5 z-10 h-4 w-24 -translate-x-1/2 rounded-full bg-neutral-900" />
        <div className="overflow-hidden rounded-[2rem] bg-white">
          <iframe
            key={src}
            src={src}
            title="Vista previa del menú"
            className="block h-[600px] w-full"
          />
        </div>
      </div>
    </div>
  );
}
