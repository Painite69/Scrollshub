// Shared inline SVG icons
import type { ReactNode } from 'react'

export function DragHandle({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <circle cx="5" cy="3" r="1.5" />
      <circle cx="11" cy="3" r="1.5" />
      <circle cx="5" cy="8" r="1.5" />
      <circle cx="11" cy="8" r="1.5" />
      <circle cx="5" cy="13" r="1.5" />
      <circle cx="11" cy="13" r="1.5" />
    </svg>
  )
}

export function EditIconGroup() {
  return (
    <img src="/custom_assets/edit.webp" alt="" width={24}/>
  )
}

export function EditIcon() {
  return (
    <img src="/custom_assets/edit.webp" alt="" width={18}/>
  )
}

export function DeleteIconGroup() {
  return (
    <img src="/custom_assets/delete.png" alt="" width={20}/>
  )
}

export function DeleteIcon() {
  return (
    <img src="/custom_assets/delete.png" alt="" width={12}/>
  )
}

export function InfoIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="8" strokeWidth="3" strokeLinecap="round" />
      <line x1="12" y1="12" x2="12" y2="16" />
    </svg>
  )
}

export function DuplicateIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="14" height="14" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
}

/** Lucide-style icons for the desktop overlay (no external icon package). */
type IconProps = { className?: string; strokeWidth?: number }

function Svg({ className = 'size-3.5', strokeWidth = 2, children }: IconProps & { children: ReactNode }) {
  return (
    <svg
      className={className}
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  )
}

export function ChevronLeftIcon(p: IconProps) {
  return <Svg {...p}><path d="m15 18-6-6 6-6" /></Svg>
}
export function ChevronRightIcon(p: IconProps) {
  return <Svg {...p}><path d="m9 18 6-6-6-6" /></Svg>
}
export function ChevronUpIcon(p: IconProps) {
  return <Svg {...p}><path d="m18 15-6-6-6 6" /></Svg>
}
export function ChevronDownIcon(p: IconProps) {
  return <Svg {...p}><path d="m6 9 6 6 6-6" /></Svg>
}
export function PlusIcon(p: IconProps) {
  return <Svg {...p}><path d="M5 12h14" /><path d="M12 5v14" /></Svg>
}
export function XIcon(p: IconProps) {
  return <Svg {...p}><path d="M18 6 6 18" /><path d="m6 6 12 12" /></Svg>
}
export function AppWindowIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="M2 8h20" />
    </Svg>
  )
}
export function PanelLeftIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="M9 3v18" />
    </Svg>
  )
}
export function PanelRightIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="M15 3v18" />
    </Svg>
  )
}
export function PanelTopIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="M3 9h18" />
    </Svg>
  )
}
export function PanelBottomIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="M3 15h18" />
    </Svg>
  )
}
export function PanelLeftCloseIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="M9 3v18" />
      <path d="m16 15-3-3 3-3" />
    </Svg>
  )
}
export function PanelRightCloseIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="M15 3v18" />
      <path d="m8 9 3 3-3 3" />
    </Svg>
  )
}
export function PanelTopCloseIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="M3 9h18" />
      <path d="m9 16 3-3 3 3" />
    </Svg>
  )
}
export function PanelBottomCloseIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="M3 15h18" />
      <path d="m15 8-3 3-3-3" />
    </Svg>
  )
}
