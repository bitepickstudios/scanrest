"use client";

import { Label, ListBox, Select } from "@heroui/react";
import type { Key } from "react";

export type SelectOption = {
  value: string;
  label: string;
};

export default function SelectField({
  value,
  onChange,
  options,
  label,
  placeholder = "Seleccionar",
  className,
  fullWidth = true,
  isDisabled,
  isRequired,
  name,
  emptyLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  options: SelectOption[];
  label?: string;
  placeholder?: string;
  className?: string;
  fullWidth?: boolean;
  isDisabled?: boolean;
  isRequired?: boolean;
  name?: string;
  emptyLabel?: string;
}) {
  const finalOptions = emptyLabel
    ? [{ value: "__empty__", label: emptyLabel }, ...options]
    : options;

  return (
    <Select
      className={className}
      fullWidth={fullWidth}
      placeholder={placeholder}
      isDisabled={isDisabled}
      isRequired={isRequired}
      name={name}
      value={value === "" && emptyLabel ? "__empty__" : value || null}
      onChange={(v: Key | Key[] | null) => {
        const next = Array.isArray(v) ? v[0] : v;
        const str = next == null ? "" : String(next);
        onChange(str === "__empty__" ? "" : str);
      }}
    >
      {label && <Label>{label}</Label>}
      <Select.Trigger>
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover>
        <ListBox>
          {finalOptions.map((o) => (
            <ListBox.Item key={o.value} id={o.value} textValue={o.label}>
              {o.label}
              <ListBox.ItemIndicator />
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
    </Select>
  );
}
