"use client";

import { useState, useTransition } from "react";
import { Plus, UserCircle, Pencil, Power, Trash2 } from "lucide-react";
import {
  Button,
  Chip,
  Input,
  Label,
  Modal,
  TextField,
} from "@heroui/react";
import SelectField from "@/components/ui/SelectField";
import {
  createStaffAccount,
  updateStaffRole,
  deactivateStaff,
  deleteStaff,
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

  function handleDelete(s: StaffRow) {
    if (
      !confirm(
        `¿Eliminar a ${s.display_name ?? s.user_id}? Esta acción es permanente.`
      )
    )
      return;
    startTransition(async () => {
      try {
        await deleteStaff(s.id);
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
                  variant="ghost"
                  size="sm"
                  isIconOnly
                  onPress={() => handleDeactivate(s)}
                  isDisabled={isPending}
                  aria-label="Desactivar"
                >
                  <Power size={14} />
                </Button>
              )}
              <Button
                variant="danger-soft"
                size="sm"
                isIconOnly
                onPress={() => handleDelete(s)}
                isDisabled={isPending}
                aria-label="Eliminar"
              >
                <Trash2 size={14} />
              </Button>
            </div>
          </div>
        );
      })}

      <Button
        type="button"
        onPress={() => setEditing("new")}
        variant="outline"
        fullWidth
        className="h-auto justify-start border-dashed bg-white p-3 text-left"
      >
        <div className="flex w-full items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-500">
            <Plus size={15} />
          </div>
          <div>
            <p className="text-sm font-semibold text-neutral-900">
              Crear miembro
            </p>
            <p className="text-xs font-normal text-neutral-500">
              Le creás cuenta con email y contraseña.
            </p>
          </div>
        </div>
      </Button>

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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
          await createStaffAccount({
            email: email.trim(),
            password,
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

  const canSubmit = staff
    ? true
    : email.trim().length > 0 && password.length >= 6;

  return (
    <Modal.Backdrop isOpen onOpenChange={(open) => !open && onClose()}>
      <Modal.Container>
        <Modal.Dialog className="sm:max-w-md">
          <Modal.CloseTrigger />
          <Modal.Header>
            <Modal.Heading>
              {staff ? "Editar miembro" : "Crear miembro"}
            </Modal.Heading>
          </Modal.Header>

          <form onSubmit={handleSubmit}>
            <Modal.Body className="space-y-3">
              {!staff && (
                <>
                  <TextField
                    isRequired
                    type="email"
                    value={email}
                    onChange={setEmail}
                    className="w-full"
                  >
                    <Label>Email</Label>
                    <Input placeholder="mozo@restaurante.com" />
                  </TextField>

                  <TextField
                    isRequired
                    type="password"
                    value={password}
                    onChange={setPassword}
                    minLength={6}
                    className="w-full"
                  >
                    <Label>Contraseña</Label>
                    <Input placeholder="Mínimo 6 caracteres" />
                  </TextField>

                  <TextField
                    value={displayName}
                    onChange={setDisplayName}
                    className="w-full"
                  >
                    <Label>Nombre visible</Label>
                    <Input placeholder="Juan Pérez" />
                  </TextField>
                </>
              )}

              <SelectField
                label="Rol *"
                value={role}
                onChange={(v) => setRole(v as StaffRole)}
                options={[
                  { value: "admin", label: "Admin (gestiona sucursal)" },
                  { value: "waiter", label: "Mozo (toma pedidos en mesa)" },
                ]}
                placeholder="Seleccionar rol"
              />

              {!staff && (
                <SelectField
                  label="Sucursal"
                  value={branchId}
                  onChange={(v) => {
                    setBranchId(v);
                    setZoneIds([]);
                  }}
                  options={branches.map((b) => ({ value: b.id, label: b.name }))}
                  emptyLabel="Todas (admin global)"
                  placeholder="Seleccionar sucursal"
                />
              )}

              {role === "waiter" && (staff ? true : !!branchId) && (
                <div>
                  <Label>Zonas asignadas</Label>
                  {branchZones.length === 0 ? (
                    <p className="mt-1 text-xs text-neutral-500">
                      Esta sucursal no tiene zonas. Creá zonas primero.
                    </p>
                  ) : (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {branchZones.map((z) => {
                        const selected = zoneIds.includes(z.id);
                        return (
                          <Button
                            key={z.id}
                            type="button"
                            size="sm"
                            variant={selected ? "primary" : "outline"}
                            onPress={() => toggleZone(z.id)}
                            className="rounded-full"
                          >
                            {z.name}
                          </Button>
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
            </Modal.Body>

            <Modal.Footer>
              <Button variant="ghost" type="button" onPress={onClose}>
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                isDisabled={isPending || !canSubmit}
              >
                {staff ? "Guardar" : "Crear cuenta"}
              </Button>
            </Modal.Footer>
          </form>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
