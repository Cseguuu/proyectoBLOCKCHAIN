import type { SVGProps } from "react";

/**
 * Íconos de línea (stroke = currentColor) que reemplazan a los emojis.
 * Estética sobria, coherente con un documento institucional.
 */
export type IconName =
  | "verify"
  | "quill"
  | "shield"
  | "institution"
  | "student"
  | "check"
  | "x"
  | "warning"
  | "document"
  | "refresh"
  | "external"
  | "info"
  | "ban"
  | "key"
  | "chevron"
  | "fingerprint"
  | "wallet"
  | "scroll";

const PATHS: Record<IconName, JSX.Element> = {
  verify: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-3.6-3.6" />
      <path d="m8.5 11 1.8 1.8 3.4-3.6" />
    </>
  ),
  quill: (
    <>
      <path d="M20 4c-6 1-10 4-13 9l-2 5 5-2c5-3 8-7 9-13z" />
      <path d="M5 19c2-4 5-7 9-9" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3 5 6v5c0 4.2 2.8 7.6 7 9 4.2-1.4 7-4.8 7-9V6z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  institution: (
    <>
      <path d="M3 9 12 4l9 5" />
      <path d="M4 9v9m4-9v9m4-9v9m4-9v9m4-9v9" />
      <path d="M3 20h18" />
    </>
  ),
  student: (
    <>
      <path d="M12 4 2 9l10 5 10-5z" />
      <path d="M6 11v4c0 1.4 2.7 3 6 3s6-1.6 6-3v-4" />
    </>
  ),
  check: <path d="m4 12 5 5L20 6" />,
  x: <path d="M6 6l12 12M18 6 6 18" />,
  warning: (
    <>
      <path d="M12 3 2 20h20z" />
      <path d="M12 10v4" />
      <path d="M12 17h.01" />
    </>
  ),
  document: (
    <>
      <path d="M6 3h8l4 4v14H6z" />
      <path d="M14 3v4h4" />
      <path d="M9 12h6M9 16h6" />
    </>
  ),
  refresh: (
    <>
      <path d="M20 11a8 8 0 0 0-14-4.5L4 8" />
      <path d="M4 4v4h4" />
      <path d="M4 13a8 8 0 0 0 14 4.5L20 16" />
      <path d="M20 20v-4h-4" />
    </>
  ),
  external: (
    <>
      <path d="M14 4h6v6" />
      <path d="M20 4 10 14" />
      <path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5" />
      <path d="M12 8h.01" />
    </>
  ),
  ban: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m6 6 12 12" />
    </>
  ),
  key: (
    <>
      <circle cx="8" cy="14" r="4" />
      <path d="m11 11 9-9" />
      <path d="m16 6 3 3" />
      <path d="m13 9 2 2" />
    </>
  ),
  chevron: <path d="m6 9 6 6 6-6" />,
  fingerprint: (
    <>
      <path d="M5 12a7 7 0 0 1 11-5.7" />
      <path d="M8 20a10 10 0 0 0 1-9 3 3 0 0 1 6 0c0 3 .5 5 1.5 7" />
      <path d="M12 12c0 4-.7 6-2 8" />
      <path d="M19 14c0 2 .3 4 1 5.5" />
    </>
  ),
  wallet: (
    <>
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <path d="M3 9h18" />
      <circle cx="16.5" cy="13" r="1" />
    </>
  ),
  scroll: (
    <>
      <path d="M6 4h10a2 2 0 0 1 2 2v11a3 3 0 0 1-3 3H7" />
      <path d="M18 17a3 3 0 0 0 3 3" />
      <path d="M6 4a2 2 0 0 0-2 2v1h4" />
      <path d="M9 9h6M9 13h6" />
    </>
  ),
};

interface IconProps extends Omit<SVGProps<SVGSVGElement>, "name"> {
  name: IconName;
  size?: number;
}

export function Icon({ name, size = 18, className = "", ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      {...rest}
    >
      {PATHS[name]}
    </svg>
  );
}
