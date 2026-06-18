import { useRef, useState } from "react";
import { hashDeArchivo } from "../lib/hash";

interface Props {
  onSelect: (file: File, hash: string) => void;
}

export function FileDropzone({ onSelect }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [hash, setHash] = useState<string | null>(null);

  async function procesar(file: File) {
    const h = await hashDeArchivo(file);
    const kb = (file.size / 1024).toFixed(1);
    setInfo(`📎 ${file.name} (${kb} KB, ${file.type || "tipo desconocido"})`);
    setHash(h);
    onSelect(file, h);
  }

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        aria-label="Selecciona o arrastra un archivo"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          if (e.dataTransfer.files.length) void procesar(e.dataTransfer.files[0]);
        }}
        className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition ${
          over ? "border-accent bg-accent/5 text-text" : "border-border text-muted"
        }`}
      >
        <p className="text-sm">📄 Arrastra cualquier archivo aquí o haz clic para elegir</p>
        <p className="mt-1 text-xs text-muted">
          PDF, DOCX, imágenes, TXT — cualquier formato. El archivo nunca sale de tu navegador:
          solo se calcula su hash keccak256.
        </p>
        <input
          ref={inputRef}
          type="file"
          hidden
          onChange={(e) => {
            if (e.target.files?.length) void procesar(e.target.files[0]);
          }}
        />
      </div>

      {info && <p className="mt-2 text-sm text-text">{info}</p>}
      {hash && (
        <div className="mt-3 break-all rounded-md border border-border bg-bg p-2.5 font-mono text-xs text-accent">
          keccak256: {hash}
        </div>
      )}
    </div>
  );
}
