"use client";

import { useCallback, useRef, useState } from "react";
import { Upload, ImagePlus, X } from "lucide-react";

export default function ImageDropzone({
  value,
  onUpload,
  onClear,
  uploading,
  accept = "image/*",
}: {
  value: string | null;
  onUpload: (file: File) => Promise<void>;
  onClear?: () => void;
  uploading?: boolean;
  accept?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const file = files[0];
      if (!file.type.startsWith("image/")) return;
      await onUpload(file);
    },
    [onUpload]
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        handleFiles(e.dataTransfer.files);
      }}
      onClick={() => !uploading && inputRef.current?.click()}
      className={`relative cursor-pointer rounded-xl border-2 border-dashed transition-colors ${
        dragOver
          ? "border-neutral-900 bg-neutral-50"
          : "border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50"
      } ${uploading ? "pointer-events-none opacity-60" : ""}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {value ? (
        <div className="relative">
          <img
            src={value}
            alt="preview"
            className="h-40 w-full rounded-[10px] object-cover"
          />
          {onClear && !uploading && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
              className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
              aria-label="Quitar imagen"
            >
              <X size={14} />
            </button>
          )}
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center rounded-[10px] bg-white/70 text-xs font-medium text-neutral-600">
              Subiendo...
            </div>
          )}
        </div>
      ) : (
        <div className="flex h-40 flex-col items-center justify-center gap-2 text-neutral-500">
          {uploading ? (
            <>
              <Upload size={22} className="animate-pulse" />
              <p className="text-sm font-medium">Subiendo...</p>
            </>
          ) : (
            <>
              <ImagePlus size={22} />
              <p className="text-sm font-medium">
                Arrastrá una imagen o hacé clic
              </p>
              <p className="text-xs text-neutral-400">PNG, JPG, WebP</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
