import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function defaults(size = 18): Partial<SVGProps<SVGSVGElement>> {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
}

export function SendIcon({ size, ...props }: IconProps) {
  return (
    <svg {...defaults(size)} {...props}>
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

export function ArrowUpIcon({ size, ...props }: IconProps) {
  return (
    <svg {...defaults(size)} {...props}>
      <path d="m5 12 7-7 7 7" />
      <path d="M12 19V5" />
    </svg>
  );
}

export function DatabaseIcon({ size, ...props }: IconProps) {
  return (
    <svg {...defaults(size)} {...props}>
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5" />
      <path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3" />
    </svg>
  );
}

export function ShieldIcon({ size, ...props }: IconProps) {
  return (
    <svg {...defaults(size)} {...props}>
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    </svg>
  );
}

export function TableIcon({ size, ...props }: IconProps) {
  return (
    <svg {...defaults(size)} {...props}>
      <path d="M12 3v18" />
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="M3 9h18" />
      <path d="M3 15h18" />
    </svg>
  );
}

export function SparklesIcon({ size, ...props }: IconProps) {
  return (
    <svg {...defaults(size)} {...props}>
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
    </svg>
  );
}

export function StopIcon({ size, ...props }: IconProps) {
  return (
    <svg {...defaults(size)} {...props}>
      <rect width="14" height="14" x="5" y="5" rx="1" />
    </svg>
  );
}

export function PlugIcon({ size, ...props }: IconProps) {
  return (
    <svg {...defaults(size)} {...props}>
      <path d="M12 22v-5" />
      <path d="M9 8V2" />
      <path d="M15 8V2" />
      <path d="M18 8v5a6 6 0 0 1-6 6a6 6 0 0 1-6-6V8z" />
    </svg>
  );
}

export function CheckIcon({ size, ...props }: IconProps) {
  return (
    <svg {...defaults(size)} {...props}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export function XIcon({ size, ...props }: IconProps) {
  return (
    <svg {...defaults(size)} {...props}>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

export function LoaderIcon({ size, ...props }: IconProps) {
  return (
    <svg {...defaults(size)} {...props}>
      <path d="M12 2v4" />
      <path d="m16.2 7.8 2.9-2.9" />
      <path d="M18 12h4" />
      <path d="m16.2 16.2 2.9 2.9" />
      <path d="M12 18v4" />
      <path d="m4.9 19.1 2.9-2.9" />
      <path d="M2 12h4" />
      <path d="m4.9 4.9 2.9 2.9" />
    </svg>
  );
}

export function AlertTriangleIcon({ size, ...props }: IconProps) {
  return (
    <svg {...defaults(size)} {...props}>
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}

export function PlayIcon({ size, ...props }: IconProps) {
  return (
    <svg {...defaults(size)} {...props}>
      <polygon points="6 3 20 12 6 21 6 3" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function ChevronDownIcon({ size, ...props }: IconProps) {
  return (
    <svg {...defaults(size)} {...props}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function CopyIcon({ size, ...props }: IconProps) {
  return (
    <svg {...defaults(size)} {...props}>
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
  );
}

export function EditIcon({ size, ...props }: IconProps) {
  return (
    <svg {...defaults(size)} {...props}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

