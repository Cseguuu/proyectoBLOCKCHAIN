import { useRef, useState } from "react";
import { hashDeArchivo } from "../lib/hash";
import { Icon } from "./Icon";

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
    setInfo(`${file.name} · ${kb} KB · ${file.type || "tipo desconocido"}`);
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
        className={`flex cursor-pointer flex-col items-center gap-2 rounded-[3px] border border-dashed p-8 text-center transition-colors ${
          over ? "border-accent bg-accent/5 text-text" : "border-line bg-inset/40 text-muted hover:border-accent/60"
        }`}
      >
        <Icon name="document" size={30} className="text-accent" />
        <p className="text-sm font-medium text-text">
          Arrastra el documento aquí o haz clic para elegir
        </p>
        <p className="max-w-md text-xs text-muted">
          PDF, DOCX, imágenes, TXT — cualquier formato. El archivo nunca sale de tu
          navegador: solo se calcula su huella keccak256.
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

      {info && (
        <p className="mt-2.5 flex items-center gap-1.5 text-sm text-text">
          <Icon name="check" size={15} className="text-ok" />
          {info}
        </p>
      )}
      {hash && (
        <div className="mt-2 break-all rounded-[3px] border border-border bg-inset px-3 py-2 font-mono text-xs text-accent">
          <span className="text-muted">keccak256: </span>
          {hash}
        </div>
      )}
    </div>
  );
}
