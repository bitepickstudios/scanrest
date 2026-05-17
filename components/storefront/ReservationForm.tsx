"use client";

import { useState, useTransition } from "react";
import { Button } from "@heroui/react";
import SelectField from "@/components/ui/SelectField";
import { Check } from "lucide-react";
import { createReservation } from "@/lib/actions/reservations";

type Zone = { id: string; name: string };

export default function ReservationForm({
  branchId,
  zones,
}: {
  branchId: string;
  zones: Zone[];
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [partySize, setPartySize] = useState(2);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [zoneId, setZoneId] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!date || !time) {
      setError("Fecha y hora son obligatorias.");
      return;
    }
    const reservationAt = new Date(`${date}T${time}`).toISOString();

    startTransition(async () => {
      try {
        await createReservation({
          branchId,
          customerName: name,
          customerPhone: phone,
          customerEmail: email || null,
          partySize,
          reservationAt,
          zoneId: zoneId || null,
          notes: notes || null,
        });
        setSuccess(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al crear la reserva.");
      }
    });
  }

  if (success) {
    return (
      <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-8 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-white">
          <Check size={24} />
        </div>
        <h2 className="text-lg font-semibold text-emerald-900">
          ¡Reserva enviada!
        </h2>
        <p className="mt-1 text-sm text-emerald-700">
          Te contactaremos por WhatsApp para confirmar.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-xs font-semibold text-neutral-700">
          Nombre
        </label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-900"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-semibold text-neutral-700">
            Teléfono
          </label>
          <input
            required
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-900"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-neutral-700">
            Personas
          </label>
          <input
            required
            type="number"
            min={1}
            max={50}
            value={partySize}
            onChange={(e) => setPartySize(parseInt(e.target.value || "1", 10))}
            className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-900"
          />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-neutral-700">
          Email (opcional)
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-900"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-semibold text-neutral-700">
            Fecha
          </label>
          <input
            required
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-900"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-neutral-700">
            Hora
          </label>
          <input
            required
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-900"
          />
        </div>
      </div>
      {zones.length > 0 && (
        <SelectField
          label="Zona preferida (opcional)"
          value={zoneId}
          onChange={setZoneId}
          options={zones.map((z) => ({ value: z.id, label: z.name }))}
          emptyLabel="Sin preferencia"
          placeholder="Sin preferencia"
        />
      )}
      <div>
        <label className="mb-1 block text-xs font-semibold text-neutral-700">
          Notas (opcional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-900"
        />
      </div>
      {error && (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </p>
      )}
      <Button
        type="submit"
        isDisabled={isPending}
        className="w-full bg-neutral-900 font-semibold text-white"
      >
        {isPending ? "Enviando..." : "Enviar reserva"}
      </Button>
    </form>
  );
}
