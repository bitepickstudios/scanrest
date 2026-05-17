"use client";

import { Tabs } from "@heroui/react";
import { type ReactNode } from "react";

export default function DashboardTabs({
  overview,
  pedidos,
  reservas,
}: {
  overview: ReactNode;
  pedidos: ReactNode;
  reservas: ReactNode;
}) {
  return (
    <Tabs defaultSelectedKey="overview">
      <Tabs.ListContainer className="w-fit">
        <Tabs.List
          aria-label="Vistas"
          className="w-fit *:h-7 *:w-fit *:px-3 *:text-sm *:font-medium"
        >
          <Tabs.Tab id="overview">
            Overview
            <Tabs.Indicator />
          </Tabs.Tab>
          <Tabs.Tab id="pedidos">
            Pedidos
            <Tabs.Indicator />
          </Tabs.Tab>
          <Tabs.Tab id="reservas">
            Reservas
            <Tabs.Indicator />
          </Tabs.Tab>
        </Tabs.List>
      </Tabs.ListContainer>
      <Tabs.Panel id="overview" className="pt-6">
        {overview}
      </Tabs.Panel>
      <Tabs.Panel id="pedidos" className="pt-6">
        {pedidos}
      </Tabs.Panel>
      <Tabs.Panel id="reservas" className="pt-6">
        {reservas}
      </Tabs.Panel>
    </Tabs>
  );
}
