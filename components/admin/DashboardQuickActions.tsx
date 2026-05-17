"use client";

import { useRouter } from "next/navigation";
import { Button } from "@heroui/react";

export default function DashboardQuickActions({
  slug,
  branchSlug,
}: {
  slug: string;
  branchSlug?: string;
}) {
  const router = useRouter();
  const base = `/admin/${slug}`;
  void branchSlug;
  return (
    <div className="flex gap-3">
      <Button variant="secondary" onPress={() => router.push(`${base}/profile`)}>
        Editar perfil del restaurante
      </Button>
      <Button variant="primary" onPress={() => router.push(`${base}/menu`)}>
        Gestionar menú
      </Button>
    </div>
  );
}
