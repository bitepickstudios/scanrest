"use client";

import type { DateValue } from "@internationalized/date";

import {
  Button,
  DateField,
  DateRangePicker,
  Label,
  RangeCalendar,
} from "@heroui/react";
import { parseDate, getLocalTimeZone, today } from "@internationalized/date";
import { Download, RefreshCw } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import SelectField from "@/components/ui/SelectField";
import NotificationsBell from "./NotificationsBell";

type Period = "day" | "7d" | "30d" | "month" | "custom";
type DateRange = { start: DateValue; end: DateValue };

export default function DashboardHeader({
  greeting,
  ordersHref,
  exportHref,
  period,
  from,
  to,
}: {
  greeting: string;
  ordersHref: string;
  exportHref: string;
  period: Period;
  from: string;
  to: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const defaultRange: DateRange = {
    start: parseDate(from),
    end: parseDate(to),
  };
  const [range, setRange] = useState<DateRange | null>(
    period === "custom" ? defaultRange : null
  );

  function setPeriod(next: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "custom") {
      const r = range ?? {
        start: today(getLocalTimeZone()),
        end: today(getLocalTimeZone()),
      };
      setRange(r);
      params.set("period", "custom");
      params.set("from", r.start.toString());
      params.set("to", r.end.toString());
    } else {
      params.set("period", next);
      params.delete("from");
      params.delete("to");
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  function applyRange(value: DateRange | null) {
    setRange(value);
    if (!value) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("period", "custom");
    params.set("from", value.start.toString());
    params.set("to", value.end.toString());
    router.push(`${pathname}?${params.toString()}`);
  }

  const exportUrl = `${exportHref}?from=${from}&to=${to}`;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-2xl font-bold text-neutral-900">{greeting}</h1>
      <div className="flex flex-wrap items-center gap-2">
        <NotificationsBell ordersHref={ordersHref} />
        <Button
          variant="ghost"
          isIconOnly
          onPress={() => router.refresh()}
          aria-label="Refrescar"
        >
          <RefreshCw size={14} />
        </Button>
        <div className="w-40">
          <SelectField
            value={period}
            onChange={(v) => setPeriod(v)}
            options={[
              { value: "day", label: "Hoy" },
              { value: "7d", label: "Últimos 7 días" },
              { value: "30d", label: "Últimos 30 días" },
              { value: "month", label: "Este mes" },
              { value: "custom", label: "Personalizado" },
            ]}
          />
        </div>
        {period === "custom" && (
          <DateRangePicker
            className="w-72"
            value={range}
            onChange={applyRange}
            endName="to"
            startName="from"
          >
            <Label className="sr-only">Rango personalizado</Label>
            <DateField.Group fullWidth>
              <DateField.Input slot="start">
                {(segment) => <DateField.Segment segment={segment} />}
              </DateField.Input>
              <DateRangePicker.RangeSeparator />
              <DateField.Input slot="end">
                {(segment) => <DateField.Segment segment={segment} />}
              </DateField.Input>
              <DateField.Suffix>
                <DateRangePicker.Trigger>
                  <DateRangePicker.TriggerIndicator />
                </DateRangePicker.Trigger>
              </DateField.Suffix>
            </DateField.Group>
            <DateRangePicker.Popover>
              <RangeCalendar aria-label="Rango de fechas">
                <RangeCalendar.Header>
                  <RangeCalendar.YearPickerTrigger>
                    <RangeCalendar.YearPickerTriggerHeading />
                    <RangeCalendar.YearPickerTriggerIndicator />
                  </RangeCalendar.YearPickerTrigger>
                  <RangeCalendar.NavButton slot="previous" />
                  <RangeCalendar.NavButton slot="next" />
                </RangeCalendar.Header>
                <RangeCalendar.Grid>
                  <RangeCalendar.GridHeader>
                    {(day) => (
                      <RangeCalendar.HeaderCell>{day}</RangeCalendar.HeaderCell>
                    )}
                  </RangeCalendar.GridHeader>
                  <RangeCalendar.GridBody>
                    {(date) => <RangeCalendar.Cell date={date} />}
                  </RangeCalendar.GridBody>
                </RangeCalendar.Grid>
                <RangeCalendar.YearPickerGrid>
                  <RangeCalendar.YearPickerGridBody>
                    {({ year }) => (
                      <RangeCalendar.YearPickerCell year={year} />
                    )}
                  </RangeCalendar.YearPickerGridBody>
                </RangeCalendar.YearPickerGrid>
              </RangeCalendar>
            </DateRangePicker.Popover>
          </DateRangePicker>
        )}
        <a href={exportUrl} download>
          <Button variant="primary" className="gap-2">
            <Download size={14} />
            Exportar
          </Button>
        </a>
      </div>
    </div>
  );
}
