"use client";

import { useState, useTransition } from "react";
import { Plus, X, UserCircle, Pencil, Power } from "lucide-react";
import { Button, Chip } from "@heroui/react";
import {
  inviteStaff,
  updateStaffRole,
  deactivateStaff,
  assignZones,
} from "@/lib/actions/staff";
import type { StaffRole } from "@/lib/database.types";

type BranchOpt = { id: string; name: string; slug: string };
type ZoneOpt = { id: string; name: string; branch_id: string };
type StaffRow = {
  id: string;
  user_id: string;
  display_name: string | null;
  role: StaffRole;
  branch_id: string | null;
  active: boolean;
  zone_ids: string[];
};

const ROLE_LABEL: Record<StaffRole, string> = {
  superadmin: "Superadmin",
  admin: "Admin",
  waiter: "Mozo",
};

export default function StaffManager({
  staff: initial,
  branches,
  zones,
}: {
  staff: StaffRow[];
  branches: BranchOpt[];
  zones: ZoneOpt[];
}) {
  const [editing, setEditing] = useState<StaffRow | "new" | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDeactivate(s: StaffRow) {
    if (!confirm(`¿Desactivar a ${s.display_name ?? s.user_id}?`)) return;
    startTransition(async () => {
      try {
        await deactivateStaff(s.id);
      } catch (e) {
        alert(e instanceof Error ? e.message : "Error");
      }
    });
  }

  return (
    <div className="space-y-2">
      {initial.length === 0 && (
        <div className="rounded-xl border-2 border-dashed border-neutral-200 p-8 text-center">
          <UserCircle size={28} className="mx-auto mb-2 text-neutral-300" />
          <p className="text-sm text-neutral-500">
            Sin staff todavía. Invitá admins de sucursal o mozos.
          </p>
        </div>
      )}

      {initial.map((s) => {
        const branch = branches.find((b) => b.id === s.branch_id);
        const zoneNames = zones
          .filter((z) => s.zone_ids.includes(z.id))
          .map((z) => z.name);
        return (
          <div
            key={s.id}
            className={`flex items-center gap-3 rounded-xl border bg-white p-3 ${
              s.active ? "border-neutral-200" : "border-neutral-100 opacity-60"
            }`}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-500">
              <UserCircle size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-semibold text-neutral-900">
                  {s.display_name ?? "(sin nombre)"}
                </p>
                <Chip size="sm" variant="soft">
                  {ROLE_LABEL[s.role]}
                </Chip>
                {branch && (
                  <Chip size="sm" variant="soft" color="accent">
                    {branch.name}
                  </Chip>
                )}
                {!s.active && (
                  <Chip size="sm" variant="soft" color="warning">
                    Inactivo
                  </Chip>
                )}
              </div>
              <p className="truncate text-xs text-neutral-500">
                {s.user_id}
                {zoneNames.length > 0 ? ` · zonas: ${zoneNames.join(", ")}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                isIconOnly
                onPress={() => setEditing(s)}
                aria-label="Editar"
              >
                <Pencil size={14} />
              </Button>
              {s.active && (
                <Button
                  variant="danger-soft"
                  size="sm"
                  isIconOnly
                  onPress={() => handleDeactivate(s)}
                  isDisabled={isPending}
                  aria-label="Desactivar"
                >
                  <Power size={14} />
                </Button>
              )}
            </div>
          </div>
        );
      })}

      <button
        type="button"
        onClick={() => setEditing("new")}
        className="block w-full rounded-xl border border-dashed border-neutral-300 bg-white p-3 text-left transition-all hover:border-neutral-400"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-500">
            <Plus size={15} />
          </div>
          <div>
            <p className="text-sm font-semibold text-neutral-900">
              Invitar miembro
            </p>
            <p className="text-xs text-neutral-500">
              El usuario debe haberse registrado primero.
            </p>
          </div>
        </div>
      </button>

      {editing && (
        <StaffModal
          staff={editing === "new" ? null : editing}
          branches={branches}
          zones={zones}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function StaffModal({
  staff,
  branches,
  zones,
  onClose,
}: {
  staff: StaffRow | null;
  branches: BranchOpt[];
  zones: ZoneOpt[];
  onClose: () => void;
}) {
  const [userId, setUserId] = useState(staff?.user_id ?? "");
  const [displayName, setDisplayName] = useState(staff?.display_name ?? "");
  const [role, setRole] = useState<StaffRole>(staff?.role ?? "waiter");
  const [branchId, setBranchId] = useState<string>(staff?.branch_id ?? "");
  const [zoneIds, setZoneIds] = useState<string[]>(staff?.zone_ids ?? []);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const branchZones = zones.filter((z) => z.branch_id === branchId);

  function toggleZone(zoneId: string) {
    setZoneIds((prev) =>
      prev.includes(zoneId)
        ? prev.filter((id) => id !== zoneId)
        : [...prev, zoneId]
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        if (staff) {
          await updateStaffRole(staff.id, role);
          if (role === "waiter") {
            await assignZones(staff.id, zoneIds);
          }
        } else {
          await inviteStaff({
            userId: userId.trim(),
            role,
            branchId: branchId || null,
            displayName: displayName.trim() || null,
            zoneIds: role === "waiter" ? zoneIds : [],
          });
        }
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al guardar");
      }
    });
  }

  const inputClass =
    "w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-400";
  const labelClass = "mb-1 block text-sm font-medium text-neutral-700";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-3">
          <h2 className="text-base font-semibold">
            {staff ? "Editar miembro" : "Invitar miembro"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-100"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3 p-5">
          {!staff && (
            <>
              <div>
                <label className={labelClass}>User ID (UUID) *</label>
                <input
                  required
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className={inputClass}
                  placeholder="00000000-0000-0000-0000-000000000000"
                />
                <p className="mt-1 text-xs text-neutral-500">
                  Pedile al usuario que se registre en /auth/register, y luego
                  copiá su user_id desde Supabase.
                </p>
              </div>
              <div>
                <label className={labelClass}>Nombre visible</label>
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className={inputClass}
                  placeholder="Juan Pérez"
                />
              </div>
            </>
          )}

          <div>
            <label className={labelClass}>Rol *</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as StaffRole)}
              className={inputClass}
            >
              <option value="admin">Admin (gestiona sucursal)</option>
              <option value="waiter">Mozo (toma pedidos en mesa)</option>
            </select>
          </div>

          {!staff && (
            <div>
              <label className={labelClass}>Sucursal</label>
              <select
                value={branchId}
                onChange={(e) => {
                  setBranchId(e.target.value);
                  setZoneIds([]);
                }}
                className={inputClass}
              >
                <option value="">Todas (admin global)</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {role === "waiter" && (staff ? true : !!branchId) && (
            <div>
              <label className={labelClass}>Zonas asignadas</label>
              {branchZones.length === 0 ? (
                <p className="text-xs text-neutral-500">
                  Esta sucursal no tiene zonas. Creá zonas primero.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {branchZones.map((z) => {
                    const selected = zoneIds.includes(z.id);
                    return (
                      <button
                        key={z.id}
                        type="button"
                        onClick={() => toggleZone(z.id)}
                        className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                          selected
                            ? "border-neutral-900 bg-neutral-900 text-white"
                            : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300"
                        }`}
                      >
                        {z.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" type="button" onPress={onClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              isDisabled={isPending || (!staff && !userId.trim())}
            >
              {staff ? "Guardar" : "Invitar"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
