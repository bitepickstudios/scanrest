"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { setActiveTable, getActiveTable } from "@/lib/active-table";

export default function TableRestorer({
  slug,
  currentTableId,
}: {
  slug: string;
  currentTableId: string | null;
}) {
  const router = useRouter();

  useEffect(() => {
    if (currentTableId) {
      setActiveTable(slug, currentTableId);
      return;
    }
    const stored = getActiveTable(slug);
    if (stored) {
      router.replace(`/${slug}?table=${stored}`);
    }
  }, [slug, currentTableId, router]);

  return null;
}
