"use client";

import { useState, useTransition } from "react";
import { Button, Chip } from "@heroui/react";
import SelectField from "@/components/ui/SelectField";
import { Check, X, Clock, Users, Phone } from "lucide-react";
import {
  approveReservation,
  rejectReservation,
  markSeated,
  markCompleted,
  markNoShow,
  cancelReservation,
} from "@/lib/actions/reservations";
import type { ReservationStatus } from "@/lib/database.types";

type Reservation = {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  party_size: number;
  reservation_at: string;
  duration_minutes: number;
  status: ReservationStatus;
  zone_id: string | null;
  table_id: string | null;
  notes: string | null;
};

type Table = { id: string; label: string; capacity: number | null };

const COLUMNS: { key: ReservationStatus; label: string; chip: string }[] = [
  { key: "pending", label: "Pendientes", chip: "warning" },
  { key: "confirmed", label: "Confirmadas", chip: "primary" },
  { key: "seated", label: "Sentadas", chip: "success" },
  { key: "completed", label: "Completadas", chip: "default" },
];

function fmtDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("es-PY", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ReservationsBoard({
  reservations,
  tables,
}: {
  reservations: Reservation[];
  tables: Table[];
}) {
  const [error, setError] = useState<string | null>(null);
  const [tablePicker, setTablePicker] = useState<string | null>(null);
  const [pickedTable, setPickedTable] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  function run(fn: () => Promise<void>) {
    setError(null);
    startTransition(async () => {
      try {
        await fn();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error");
      }
    });
  }

  const grouped = new Map<ReservationStatus, Reservation[]>();
  for (const r of reservations) {
    const arr = grouped.get(r.status) ?? [];
    arr.push(r);
    grouped.set(r.status, arr);
  }

  return (
    <div>
      {error && (
        <p className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {COLUMNS.map((col) => {
          const list = grouped.get(col.key) ?? [];
          return (
            <div
              key={col.key}
              className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3"
            >
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-neutral-800">
                  {col.label}
                </h2>
                <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-neutral-600">
                  {list.length}
                </span>
              </div>
              <div className="space-y-2">
                {list.map((r) => {
                  const table = tables.find((t) => t.id === r.table_id);
                  return (
                    <div
                      key={r.id}
                      className="rounded-xl border border-neutral-200 bg-white p-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-neutral-900">
                          {r.customer_name}
                        </p>
                        <Chip size="sm" variant="soft">
                          <Users size={10} className="mr-1 inline" />
                          {r.party_size}
                        </Chip>
                      </div>
                      <p className="mt-1 flex items-center gap-1 text-xs text-neutral-600">
                        <Clock size={11} /> {fmtDateTime(r.reservation_at)}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-neutral-600">
                        <Phone size={11} /> {r.customer_phone}
                      </p>
                      {table && (
                        <p className="mt-1 text-xs font-semibold text-neutral-700">
                          Mesa {table.label}
                        </p>
                      )}
                      {r.notes && (
                        <p className="mt-1 text-xs italic text-neutral-500">
                          {r.notes}
                        </p>
                      )}

                      {r.status === "pending" && (
                        <div className="mt-2 space-y-1.5">
                          {tablePicker === r.id ? (
                            <div className="space-y-1.5">
                              <SelectField
                                value={pickedTable}
                                onChange={setPickedTable}
                                options={tables.map((t) => ({
                                  value: t.id,
                                  label: `${t.label} (${t.capacity ?? 4})`,
                                }))}
                                emptyLabel="Sin mesa asignada"
                                placeholder="Asignar mesa"
                              />
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  className="flex-1 bg-emerald-600 text-white"
                                  isDisabled={isPending}
                                  onPress={() => {
                                    const tid = pickedTable || null;
                                    run(async () => {
                                      await approveReservation(r.id, tid);
                                      setTablePicker(null);
                                      setPickedTable("");
                                    });
                                  }}
                                >
                                  <Check size={12} /> Confirmar
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onPress={() => {
                                    setTablePicker(null);
                                    setPickedTable("");
                                  }}
                                >
                                  Cancelar
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                className="flex-1 bg-emerald-600 text-white"
                                onPress={() => setTablePicker(r.id)}
                              >
                                <Check size={12} /> Confirmar
                              </Button>
                              <Button
                                size="sm"
                                variant="danger-soft"
                                isDisabled={isPending}
                                onPress={() =>
                                  run(() => rejectReservation(r.id))
                                }
                              >
                                <X size={12} />
                              </Button>
                            </div>
                          )}
                        </div>
                      )}

                      {r.status === "confirmed" && (
                        <div className="mt-2 flex gap-1">
                          <Button
                            size="sm"
                            className="flex-1 bg-neutral-900 text-white"
                            isDisabled={isPending}
                            onPress={() => run(() => markSeated(r.id))}
                          >
                            Sentar
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            isDisabled={isPending}
                            onPress={() => run(() => markNoShow(r.id))}
                          >
                            No-show
                          </Button>
                          <Button
                            size="sm"
                            variant="danger-soft"
                            isDisabled={isPending}
                            onPress={() => run(() => cancelReservation(r.id))}
                          >
                            <X size={12} />
                          </Button>
                        </div>
                      )}

                      {r.status === "seated" && (
                        <Button
                          size="sm"
                          className="mt-2 w-full bg-neutral-900 text-white"
                          isDisabled={isPending}
                          onPress={() => run(() => markCompleted(r.id))}
                        >
                          Completar
                        </Button>
                      )}
                    </div>
                  );
                })}
                {list.length === 0 && (
                  <p className="rounded-xl border-2 border-dashed border-neutral-200 px-3 py-6 text-center text-xs text-neutral-400">
                    Vacío
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
