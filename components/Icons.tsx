import type { ReactNode } from "react";

type IconProps = { className?: string };

function Svg({
  className = "h-5 w-5",
  children,
}: IconProps & { children: ReactNode }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function LogoMark({ className = "h-9 w-9" }: IconProps) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-md bg-accent text-white ${className}`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12h3l2.5-6 4 12 2.5-6H21" />
      </svg>
    </span>
  );
}

export function SearchIcon(props: IconProps) {
  return <Svg {...props}><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4.5 4.5" /></Svg>;
}
export function CompassIcon(props: IconProps) {
  return <Svg {...props}><circle cx="12" cy="12" r="9" /><path d="m15.5 8.5-2 5-5 2 2-5 5-2z" /></Svg>;
}
export function BookIcon(props: IconProps) {
  return <Svg {...props}><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17H6.5A2.5 2.5 0 0 0 4 21.5z" /><path d="M4 17.5A2.5 2.5 0 0 1 6.5 15H20" /></Svg>;
}
export function DashboardIcon(props: IconProps) {
  return <Svg {...props}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></Svg>;
}
export function TeachIcon(props: IconProps) {
  return <Svg {...props}><path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 0 4 21.5z" /><path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5a1.5 1.5 0 0 1 1.5 1.5z" /></Svg>;
}
export function CertificateIcon(props: IconProps) {
  return <Svg {...props}><circle cx="12" cy="9" r="5.5" /><path d="m8.5 13.5-1.5 7L12 18l5 2.5-1.5-7" /></Svg>;
}
export function LogoutIcon(props: IconProps) {
  return <Svg {...props}><path d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4" /><path d="m15 8 4 4-4 4M19 12H9" /></Svg>;
}
export function ChevronIcon(props: IconProps) {
  return <Svg {...props}><path d="m9 6 6 6-6 6" /></Svg>;
}
export function CheckIcon(props: IconProps) {
  return <Svg {...props}><path d="m4 12.5 5 5L20 6.5" /></Svg>;
}
export function PlayIcon(props: IconProps) {
  return <Svg {...props}><path d="m8 5 11 7-11 7z" /></Svg>;
}
export function ClockIcon(props: IconProps) {
  return <Svg {...props}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Svg>;
}
export function StarIcon(props: IconProps) {
  return <Svg {...props}><path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" /></Svg>;
}
export function PlusIcon(props: IconProps) {
  return <Svg {...props}><path d="M12 5v14M5 12h14" /></Svg>;
}
export function TrashIcon(props: IconProps) {
  return <Svg {...props}><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" /></Svg>;
}
export function ArrowRightIcon(props: IconProps) {
  return <Svg {...props}><path d="M4 12h16M14 6l6 6-6 6" /></Svg>;
}
export function LockIcon(props: IconProps) {
  return <Svg {...props}><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></Svg>;
}
export function UsersIcon(props: IconProps) {
  return <Svg {...props}><circle cx="9" cy="8" r="3" /><path d="M3.5 20a5.5 5.5 0 0 1 11 0" /><circle cx="17" cy="9" r="2.5" /><path d="M15 15.2a4.5 4.5 0 0 1 5.5 4.4" /></Svg>;
}
export function CoinsIcon(props: IconProps) {
  return <Svg {...props}><ellipse cx="12" cy="6" rx="8" ry="3" /><path d="M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6" /><path d="M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" /></Svg>;
}
export function QuizIcon(props: IconProps) {
  return <Svg {...props}><path d="M9.5 9a2.5 2.5 0 1 1 4 2c-.9.7-1.5 1.3-1.5 2.5" /><path d="M12 17h.01" /><circle cx="12" cy="12" r="9" /></Svg>;
}
export function CloseIcon(props: IconProps) {
  return <Svg {...props}><path d="M6 6 18 18M18 6 6 18" /></Svg>;
}
export function MenuIcon(props: IconProps) {
  return <Svg {...props}><path d="M4 7h16M4 12h16M4 17h16" /></Svg>;
}
export function UpIcon(props: IconProps) {
  return <Svg {...props}><path d="m6 14 6-6 6 6" /></Svg>;
}
export function DownIcon(props: IconProps) {
  return <Svg {...props}><path d="m6 10 6 6 6-6" /></Svg>;
}
export function EyeIcon(props: IconProps) {
  return <Svg {...props}><path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6-10-6-10-6z" /><circle cx="12" cy="12" r="2.5" /></Svg>;
}
