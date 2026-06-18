import { useId } from "react";

interface SealProps {
  /** Texto curvado en el anillo superior. */
  top?: string;
  /** Texto curvado en el anillo inferior. */
  bottom?: string;
  /** Estado visual: define color e ícono central. */
  estado?: "valido" | "revocado" | "neutro";
  size?: number;
  /** Aplica la animación de timbrado al montar. */
  stamp?: boolean;
  className?: string;
}

const COLORES = {
  valido: "#2f6b46",
  revocado: "#9a6b1e",
  neutro: "#7a1f2b",
} as const;

/**
 * Sello/timbre circular estilo lacre institucional, con texto curvado.
 * Se usa como marca de la "oficina" en el encabezado y como estampa de
 * resultado al verificar un certificado.
 */
export function Seal({
  top = "REGISTRO ACADÉMICO",
  bottom = "UNIVERSIDAD ADOLFO IBÁÑEZ",
  estado = "neutro",
  size = 96,
  stamp = false,
  className = "",
}: SealProps) {
  const color = COLORES[estado];
  // useId garantiza ids únicos aunque haya varios sellos en la página.
  const id = useId().replace(/:/g, "");

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={`${stamp ? "animate-stamp" : ""} ${className}`}
      style={{ color }}
      role="img"
      aria-label={`Sello: ${top} ${bottom}`}
    >
      <defs>
        <path id={`${id}-top`} d="M50,50 m-37,0 a37,37 0 1,1 74,0" fill="none" />
        <path id={`${id}-bottom`} d="M50,50 m-32,0 a32,32 0 1,0 64,0" fill="none" />
      </defs>

      {/* Anillos */}
      <circle cx="50" cy="50" r="47" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="2.6" />
      <circle
        cx="50"
        cy="50"
        r="28"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.8"
        strokeDasharray="1 3"
      />

      {/* Texto curvado */}
      <text
        fill="currentColor"
        fontSize="6.4"
        fontWeight="700"
        letterSpacing="1.1"
        fontFamily="Inter, sans-serif"
      >
        <textPath href={`#${id}-top`} startOffset="50%" textAnchor="middle">
          {top}
        </textPath>
      </text>
      <text
        fill="currentColor"
        fontSize="5"
        fontWeight="600"
        letterSpacing="0.8"
        fontFamily="Inter, sans-serif"
      >
        <textPath href={`#${id}-bottom`} startOffset="50%" textAnchor="middle">
          {bottom}
        </textPath>
      </text>

      {/* Pequeñas estrellas a los lados */}
      <text x="14.5" y="52.5" fill="currentColor" fontSize="6">
        ★
      </text>
      <text x="80" y="52.5" fill="currentColor" fontSize="6">
        ★
      </text>

      {/* Marca central según estado */}
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        transform="translate(38,38) scale(1)"
      >
        {estado === "revocado" ? (
          <>
            <circle cx="12" cy="12" r="11" strokeWidth="2.2" />
            <path d="m5 5 14 14" />
          </>
        ) : (
          <path d="m4 12 5 6L20 6" />
        )}
      </g>
    </svg>
  );
}
