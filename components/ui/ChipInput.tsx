"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Input, Chip } from "@heroui/react";

export default function ChipInput({
  value,
  onChange,
  placeholder = "Escribí y presioná Enter...",
}: {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState("");

  function commit() {
    const item = draft.trim();
    if (!item) return;
    const exists = value.some((v) => v.toLowerCase() === item.toLowerCase());
    if (!exists) onChange([...value, item]);
    setDraft("");
  }

  function remove(item: string) {
    onChange(value.filter((v) => v !== item));
  }

  return (
    <div className="space-y-2">
      <Input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder={placeholder}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          }
          if (e.key === "Backspace" && !draft && value.length > 0) {
            remove(value[value.length - 1]);
          }
        }}
        onBlur={() => commit()}
      />
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((item) => (
            <Chip key={item} variant="soft" size="sm">
              <Chip.Label>{item}</Chip.Label>
              <button
                type="button"
                onClick={() => remove(item)}
                className="ml-0.5 rounded-full p-0.5 text-neutral-400 transition-colors hover:bg-neutral-200 hover:text-neutral-700"
                aria-label={`Quitar ${item}`}
              >
                <X size={11} />
              </button>
            </Chip>
          ))}
        </div>
      )}
    </div>
  );
}
