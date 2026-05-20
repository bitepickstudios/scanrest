"use client";

import { useRouter, usePathname } from "next/navigation";
import { Tabs } from "@heroui/react";
import { useTransition } from "react";

export interface NavTab {
  key: string;
  label: string;
  href: string;
  matchPaths?: string[];
  exact?: boolean;
}

export default function NavTabs({ tabs }: { tabs: NavTab[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();

  const nonExact = tabs.filter((t) => !t.exact);
  const exactMatch = tabs.find(
    (t) => t.exact && (t.matchPaths ?? [t.href]).some((p) => pathname === p),
  );
  const prefixMatch = nonExact.find((t) =>
    (t.matchPaths ?? [t.href]).some(
      (p) => pathname === p || pathname.startsWith(`${p}/`),
    ),
  );
  const activeKey = exactMatch?.key ?? prefixMatch?.key ?? tabs[0]?.key;

  return (
    <Tabs
      selectedKey={activeKey}
      onSelectionChange={(key) => {
        const tab = tabs.find((t) => t.key === key);
        if (!tab || tab.href === pathname) return;
        startTransition(() => router.push(tab.href));
      }}
    >
      <Tabs.ListContainer className="w-fit">
        <Tabs.List
          aria-label="Secciones"
          className="w-fit *:h-7 *:w-fit *:px-3 *:text-sm *:font-medium"
        >
          {tabs.map((t) => (
            <Tabs.Tab key={t.key} id={t.key}>
              {t.label}
              <Tabs.Indicator />
            </Tabs.Tab>
          ))}
        </Tabs.List>
      </Tabs.ListContainer>
    </Tabs>
  );
}
