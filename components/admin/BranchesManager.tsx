"use client";

import { useState, useTransition } from "react";
import { Plus, MapPin, Star, Pencil, Trash2, Power } from "lucide-react";
import {
  Button,
  Card,
  Chip,
  Switch,
  Modal,
  TextField,
  Input,
  Label,
} from "@heroui/react";
import SelectField from "@/components/ui/SelectField";
import {
  createBranch,
  updateBranch,
  deleteBranch,
  setDefaultBranch,
} from "@/lib/actions/branches";
import type { Branch, BranchType } from "@/lib/database.types";

type BranchRow = Pick<
  Branch,
  "id" | "slug" | "name" | "address" | "phone" | "type" | "is_default" | "active"
>;

export default function BranchesManager({
  restaurantSlug,
  branches: initial,
}: {
  restaurantSlug: string;
  branches: BranchRow[];
}) {
  const [editing, setEditing] = useState<BranchRow | "new" | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSetDefault(id: string) {
    startTransition(async () => {
      try {
        await setDefaultBranch(id);
      } catch (e) {
        alert(e instanceof Error ? e.message : "Error");
      }
    });
  }

  function handleToggleActive(b: BranchRow) {
    startTransition(async () => {
      try {
        await updateBranch(b.id, { active: !b.active });
      } catch (e) {
        alert(e instanceof Error ? e.message : "Error");
      }
    });
  }

  function handleDelete(b: BranchRow) {
    if (!confirm(`¿Eliminar sucursal "${b.name}"? Esto borra mesas, pedidos y reseñas asociadas.`)) return;
    startTransition(async () => {
      try {
        await deleteBranch(b.id);
      } catch (e) {
        alert(e instanceof Error ? e.message : "Error");
      }
    });
  }

  return (
    <div className="space-y-2">
      {initial.map((b) => (
        <Card
          key={b.id}
          variant="default"
          className="transition-all hover:border-neutral-300"
        >
          <Card.Content className="!flex !flex-row items-center gap-3 !p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-500">
              <MapPin size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <a
                  href={`/admin/${restaurantSlug}/${b.slug}`}
                  className="truncate text-sm font-semibold text-neutral-900 hover:underline"
                >
                  {b.name}
                </a>
                {b.is_default && (
                  <Chip size="sm" variant="soft">
                    Principal
                  </Chip>
                )}
                {b.type === "foodpark_stall" ? (
                  <Chip size="sm" variant="soft" color="accent">
                    Food court (take and go)
                  </Chip>
                ) : (
                  <Chip size="sm" variant="soft">
                    Local con mesas
                  </Chip>
                )}
                {!b.active && (
                  <Chip size="sm" variant="soft" color="warning">
                    Inactiva
                  </Chip>
                )}
              </div>
              <p className="truncate text-xs text-neutral-500">
                /{b.slug}
                {b.address ? ` · ${b.address}` : ""}
                {b.phone ? ` · ${b.phone}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-1">
              {!b.is_default && b.active && (
                <Button
                  variant="ghost"
                  size="sm"
                  isIconOnly
                  onPress={() => handleSetDefault(b.id)}
                  isDisabled={isPending}
                  aria-label="Marcar como principal"
                >
                  <Star size={15} />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                isIconOnly
                onPress={() => handleToggleActive(b)}
                isDisabled={isPending}
                aria-label={b.active ? "Desactivar" : "Activar"}
              >
                <Power size={15} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                isIconOnly
                onPress={() => setEditing(b)}
                aria-label="Editar"
              >
                <Pencil size={15} />
              </Button>
              <Button
                variant="danger-soft"
                size="sm"
                isIconOnly
                onPress={() => handleDelete(b)}
                isDisabled={isPending}
                aria-label="Eliminar"
              >
                <Trash2 size={15} />
              </Button>
            </div>
          </Card.Content>
        </Card>
      ))}

      <Button
        type="button"
        onPress={() => setEditing("new")}
        variant="outline"
        fullWidth
        className="h-auto justify-start border-dashed bg-white p-4 text-left"
      >
        <div className="flex w-full items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-500">
            <Plus size={18} />
          </div>
          <div>
            <p className="text-sm font-semibold text-neutral-900">
              Crear sucursal
            </p>
            <p className="text-xs font-normal text-neutral-500">
              Cada sucursal tiene mesas, mozos, pedidos y menú propios.
            </p>
          </div>
        </div>
      </Button>

      {editing && (
        <BranchModal
          branch={editing === "new" ? null : editing}
          hasDefault={initial.some((b) => b.is_default)}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function BranchModal({
  branch,
  hasDefault,
  onClose,
}: {
  branch: BranchRow | null;
  hasDefault: boolean;
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState(branch?.name ?? "");
  const [slug, setSlug] = useState(branch?.slug ?? "");
  const [slugEdited, setSlugEdited] = useState(Boolean(branch?.slug));

  function slugifyLocal(s: string) {
    return s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }

  function handleNameChange(v: string) {
    setName(v);
    if (!slugEdited) setSlug(slugifyLocal(v));
  }

  function handleSlugChange(v: string) {
    setSlug(v);
    setSlugEdited(true);
  }
  const [address, setAddress] = useState(branch?.address ?? "");
  const [phone, setPhone] = useState(branch?.phone ?? "");
  const [type, setType] = useState<BranchType>(branch?.type ?? "standalone");
  const [isDefault, setIsDefault] = useState(branch?.is_default ?? !hasDefault);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        if (branch) {
          await updateBranch(branch.id, {
            name: name.trim(),
            slug: slug.trim() || undefined,
            address: address.trim() || null,
            phone: phone.trim() || null,
            type,
          });
          if (isDefault && !branch.is_default) {
            const { setDefaultBranch } = await import(
              "@/lib/actions/branches"
            );
            await setDefaultBranch(branch.id);
          }
        } else {
          await createBranch({
            name: name.trim(),
            slug: slug.trim() || undefined,
            address: address.trim() || null,
            phone: phone.trim() || null,
            type,
            isDefault,
          });
        }
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al guardar");
      }
    });
  }

  return (
    <Modal.Backdrop isOpen onOpenChange={(open) => !open && onClose()}>
      <Modal.Container>
        <Modal.Dialog className="sm:max-w-md">
          <Modal.CloseTrigger />
          <Modal.Header>
            <Modal.Heading>
              {branch ? "Editar sucursal" : "Nueva sucursal"}
            </Modal.Heading>
          </Modal.Header>

          <form onSubmit={handleSubmit}>
            <Modal.Body className="space-y-3">
              <TextField
                isRequired
                value={name}
                onChange={handleNameChange}
                className="w-full"
              >
                <Label>Nombre</Label>
                <Input placeholder="Sucursal Centro" />
              </TextField>

              <TextField
                value={slug}
                onChange={handleSlugChange}
                className="w-full"
              >
                <Label>Slug (URL)</Label>
                <Input placeholder="centro" />
              </TextField>

              <TextField
                value={address}
                onChange={setAddress}
                className="w-full"
              >
                <Label>Dirección</Label>
                <Input placeholder="Av. Mariscal López 1234" />
              </TextField>

              <TextField
                value={phone}
                onChange={setPhone}
                className="w-full"
              >
                <Label>Teléfono</Label>
                <Input placeholder="+595 ..." />
              </TextField>

              <SelectField
                label="Tipo"
                value={type}
                onChange={(v) => setType(v as BranchType)}
                options={[
                  { value: "standalone", label: "Local con mesas" },
                  { value: "foodpark_stall", label: "Food court (take and go)" },
                ]}
                placeholder="Seleccionar tipo"
              />

              <div className="flex items-center justify-between rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-2">
                <div>
                  <p className="text-sm font-medium text-neutral-800">
                    Sucursal principal
                  </p>
                  <p className="text-xs text-neutral-500">
                    Default cuando un cliente abre el restaurante.
                  </p>
                </div>
                <Switch
                  isSelected={isDefault}
                  onChange={() => setIsDefault((v) => !v)}
                  size="sm"
                  aria-label="Sucursal principal"
                >
                  <Switch.Control>
                    <Switch.Thumb />
                  </Switch.Control>
                </Switch>
              </div>

              {error && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                  {error}
                </p>
              )}
            </Modal.Body>

            <Modal.Footer>
              <Button variant="ghost" onPress={onClose} type="button">
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                isDisabled={isPending || !name.trim()}
              >
                {branch ? "Guardar" : "Crear"}
              </Button>
            </Modal.Footer>
          </form>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
