"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, Pencil, Check } from "lucide-react";
import {
  Button,
  Input,
  NumberField,
  Label,
  Checkbox,
} from "@heroui/react";
import {
  createModifierGroup,
  createModifier,
  updateModifierGroup,
  updateModifier,
  deleteModifierGroup,
  deleteModifier,
} from "@/lib/actions/menu";
import type { ModifierGroup, Modifier } from "@/lib/types";

export type GroupWithModifiers = ModifierGroup & { modifiers: Modifier[] };

export default function ModifierEditor({
  productId,
  groups,
  onChange,
}: {
  productId: string;
  groups: GroupWithModifiers[];
  onChange: (next: GroupWithModifiers[]) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupRequired, setNewGroupRequired] = useState(false);
  const [newGroupMax, setNewGroupMax] = useState(1);

  async function addGroup() {
    if (!newGroupName.trim()) return;
    const created = await createModifierGroup(productId, {
      name: newGroupName.trim(),
      required: newGroupRequired,
      max_selections: newGroupMax,
    });
    if (created) {
      onChange([
        ...groups,
        { ...(created as ModifierGroup), modifiers: [] },
      ]);
      setNewGroupName("");
      setNewGroupRequired(false);
      setNewGroupMax(1);
    }
  }

  return (
    <div className="space-y-3">
      {groups.map((g) => (
        <ModifierGroupCard
          key={g.id}
          group={g}
          isPending={isPending}
          onUpdate={(next) => {
            onChange(groups.map((x) => (x.id === g.id ? next : x)));
          }}
          onDelete={() => {
            if (!confirm("¿Eliminar grupo?")) return;
            startTransition(async () => {
              await deleteModifierGroup(g.id);
              onChange(groups.filter((x) => x.id !== g.id));
            });
          }}
        />
      ))}

      <div className="rounded-xl border border-dashed border-neutral-300 p-3">
        <p className="mb-2 text-xs font-medium text-neutral-500">Nuevo grupo</p>
        <div className="space-y-2">
          <Input
            placeholder="Ej: Tamaño, Extras..."
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
          />
          <div className="flex flex-wrap items-center gap-4">
            <Checkbox isSelected={newGroupRequired} onChange={setNewGroupRequired}>
              <Checkbox.Control>
                <Checkbox.Indicator />
              </Checkbox.Control>
              <Checkbox.Content>
                <Label className="text-sm">Requerido</Label>
              </Checkbox.Content>
            </Checkbox>

            <NumberField
              value={newGroupMax}
              onChange={(v) => setNewGroupMax(v ?? 1)}
              minValue={1}
              className="w-32"
            >
              <Label className="text-xs text-neutral-500">Máx. distintos</Label>
              <NumberField.Group>
                <NumberField.DecrementButton />
                <NumberField.Input />
                <NumberField.IncrementButton />
              </NumberField.Group>
            </NumberField>
          </div>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onPress={addGroup}
            isDisabled={!newGroupName.trim()}
          >
            <Plus size={12} /> Crear grupo
          </Button>
        </div>
      </div>
    </div>
  );
}

function ModifierGroupCard({
  group,
  isPending,
  onUpdate,
  onDelete,
}: {
  group: GroupWithModifiers;
  isPending: boolean;
  onUpdate: (next: GroupWithModifiers) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(group.name);
  const [required, setRequired] = useState(group.required);
  const [maxSel, setMaxSel] = useState(group.max_selections);

  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDelta, setNewDelta] = useState(0);
  const [newMaxPerItem, setNewMaxPerItem] = useState(1);

  async function saveHeader() {
    const updated = await updateModifierGroup(group.id, {
      name: name.trim() || group.name,
      required,
      max_selections: maxSel,
    });
    if (updated) {
      onUpdate({ ...group, ...(updated as ModifierGroup), modifiers: group.modifiers });
      setEditing(false);
    }
  }

  async function addItem() {
    if (!newName.trim()) return;
    const created = await createModifier(group.id, {
      name: newName.trim(),
      price_delta: newDelta,
      max_per_item: newMaxPerItem,
    });
    if (created) {
      onUpdate({
        ...group,
        modifiers: [...group.modifiers, created as Modifier],
      });
      setNewName("");
      setNewDelta(0);
      setNewMaxPerItem(1);
      setAdding(false);
    }
  }

  return (
    <div className="rounded-xl border border-neutral-200 p-3">
      <div className="flex items-start justify-between gap-2">
        {editing ? (
          <div className="flex-1 space-y-2">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre del grupo"
            />
            <div className="flex flex-wrap items-center gap-3">
              <Checkbox isSelected={required} onChange={setRequired}>
                <Checkbox.Control>
                  <Checkbox.Indicator />
                </Checkbox.Control>
                <Checkbox.Content>
                  <Label className="text-sm">Requerido</Label>
                </Checkbox.Content>
              </Checkbox>
              <NumberField
                value={maxSel}
                onChange={(v) => setMaxSel(v ?? 1)}
                minValue={1}
                className="w-28"
              >
                <Label className="text-xs text-neutral-500">Máx. distintos</Label>
                <NumberField.Group>
                  <NumberField.DecrementButton />
                  <NumberField.Input />
                  <NumberField.IncrementButton />
                </NumberField.Group>
              </NumberField>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="primary" size="sm" onPress={saveHeader}>
                <Check size={12} /> Guardar
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onPress={() => {
                  setEditing(false);
                  setName(group.name);
                  setRequired(group.required);
                  setMaxSel(group.max_selections);
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div>
              <p className="text-sm font-semibold">{group.name}</p>
              <p className="text-xs text-neutral-400">
                {group.required ? "Requerido" : "Opcional"} · máx. {group.max_selections}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                isIconOnly
                onPress={() => setEditing(true)}
                aria-label="Editar grupo"
              >
                <Pencil size={12} />
              </Button>
              <Button
                type="button"
                variant="danger-soft"
                size="sm"
                isIconOnly
                onPress={onDelete}
                isDisabled={isPending}
                aria-label="Eliminar grupo"
              >
                <Trash2 size={12} />
              </Button>
            </div>
          </>
        )}
      </div>

      <div className="mt-3 space-y-1.5">
        {group.modifiers?.map((mod) => (
          <ModifierItemRow
            key={mod.id}
            mod={mod}
            onUpdate={(next) => {
              onUpdate({
                ...group,
                modifiers: group.modifiers.map((m) => (m.id === mod.id ? next : m)),
              });
            }}
            onDelete={async () => {
              await deleteModifier(mod.id);
              onUpdate({
                ...group,
                modifiers: group.modifiers.filter((m) => m.id !== mod.id),
              });
            }}
          />
        ))}

        {adding ? (
          <div className="space-y-2 rounded-lg bg-neutral-50 p-2">
            <Input
              placeholder="Nombre (ej. Extra queso)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              autoFocus
            />
            <div className="flex flex-wrap items-center gap-2">
              <NumberField
                value={newDelta}
                onChange={(v) => setNewDelta(v ?? 0)}
                step={500}
                className="w-32"
              >
                <Label className="text-xs text-neutral-500">± Gs.</Label>
                <NumberField.Group>
                  <NumberField.DecrementButton />
                  <NumberField.Input />
                  <NumberField.IncrementButton />
                </NumberField.Group>
              </NumberField>
              <NumberField
                value={newMaxPerItem}
                onChange={(v) => setNewMaxPerItem(v ?? 1)}
                minValue={1}
                className="w-28"
              >
                <Label className="text-xs text-neutral-500">Repetir hasta</Label>
                <NumberField.Group>
                  <NumberField.DecrementButton />
                  <NumberField.Input />
                  <NumberField.IncrementButton />
                </NumberField.Group>
              </NumberField>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="primary" size="sm" onPress={addItem}>
                <Plus size={12} /> Agregar
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onPress={() => {
                  setAdding(false);
                  setNewName("");
                  setNewDelta(0);
                  setNewMaxPerItem(1);
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onPress={() => setAdding(true)}
          >
            <Plus size={12} /> Agregar opción
          </Button>
        )}
      </div>
    </div>
  );
}

function ModifierItemRow({
  mod,
  onUpdate,
  onDelete,
}: {
  mod: Modifier;
  onUpdate: (next: Modifier) => void;
  onDelete: () => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(mod.name);
  const [delta, setDelta] = useState(mod.price_delta);
  const [maxPerItem, setMaxPerItem] = useState(mod.max_per_item ?? 1);

  async function save() {
    const updated = await updateModifier(mod.id, {
      name: name.trim() || mod.name,
      price_delta: delta,
      max_per_item: maxPerItem,
    });
    if (updated) {
      onUpdate(updated as Modifier);
      setEditing(false);
    }
  }

  if (editing) {
    return (
      <div className="space-y-2 rounded-lg bg-neutral-50 p-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre"
        />
        <div className="flex flex-wrap items-center gap-2">
          <NumberField
            value={delta}
            onChange={(v) => setDelta(v ?? 0)}
            step={500}
            className="w-32"
          >
            <Label className="text-xs text-neutral-500">± Gs.</Label>
            <NumberField.Group>
              <NumberField.DecrementButton />
              <NumberField.Input />
              <NumberField.IncrementButton />
            </NumberField.Group>
          </NumberField>
          <NumberField
            value={maxPerItem}
            onChange={(v) => setMaxPerItem(v ?? 1)}
            minValue={1}
            className="w-28"
          >
            <Label className="text-xs text-neutral-500">Repetir hasta</Label>
            <NumberField.Group>
              <NumberField.DecrementButton />
              <NumberField.Input />
              <NumberField.IncrementButton />
            </NumberField.Group>
          </NumberField>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="primary" size="sm" onPress={save}>
            <Check size={12} /> Guardar
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onPress={() => {
              setEditing(false);
              setName(mod.name);
              setDelta(mod.price_delta);
              setMaxPerItem(mod.max_per_item ?? 1);
            }}
          >
            Cancelar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-1.5">
      <div className="min-w-0 flex-1">
        <span className="text-sm">{mod.name}</span>
        {(mod.max_per_item ?? 1) > 1 && (
          <span className="ml-2 text-xs text-neutral-400">x{mod.max_per_item}</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        {mod.price_delta !== 0 && (
          <span className="text-xs text-neutral-500">
            {mod.price_delta > 0 ? "+" : ""}
            Gs. {mod.price_delta.toLocaleString("es-PY")}
          </span>
        )}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          isIconOnly
          onPress={() => setEditing(true)}
          aria-label="Editar"
        >
          <Pencil size={11} />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          isIconOnly
          onPress={onDelete}
          aria-label="Eliminar"
        >
          <Trash2 size={11} />
        </Button>
      </div>
    </div>
  );
}
