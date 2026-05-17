"use client";

import { Button } from "@heroui/react";
import { Download, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import SelectField from "@/components/ui/SelectField";
import { useState } from "react";
import NotificationsBell from "./NotificationsBell";

export default function DashboardHeader({
  greeting,
  ordersHref,
}: {
  greeting: string;
  ordersHref: string;
}) {
  const router = useRouter();
  const [period, setPeriod] = useState("month");

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-2xl font-bold text-neutral-900">{greeting}</h1>
      <div className="flex items-center gap-2">
        <NotificationsBell ordersHref={ordersHref} />
        <Button
          variant="ghost"
          isIconOnly
          onPress={() => router.refresh()}
          aria-label="Refrescar"
        >
          <RefreshCw size={14} />
        </Button>
        <div className="w-36">
          <SelectField
            value={period}
            onChange={setPeriod}
            options={[
              { value: "day", label: "Hoy" },
              { value: "week", label: "Semanal" },
              { value: "month", label: "Mensual" },
            ]}
          />
        </div>
        <Button variant="primary" className="gap-2">
          <Download size={14} />
          Exportar
        </Button>
      </div>
    </div>
  );
}
