import { useEffect, useRef, useState, type ComponentType } from 'react'
import {
  AppWindowIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  PanelBottomCloseIcon,
  PanelBottomIcon,
  PanelLeftCloseIcon,
  PanelLeftIcon,
  PanelRightCloseIcon,
  PanelRightIcon,
  PanelTopCloseIcon,
  PanelTopIcon,
  PlusIcon,
  XIcon,
} from '../icons'
import {
  isVerticalDock,
  type OverlayDock,
  type OverlayRevealMethod,
  type OverlaySettings,
} from '../../types/overlay_settings'

type Props = {
  settings: OverlaySettings
  onSettingsChange: (patch: Partial<OverlaySettings>) => void
  onOpenInApp: () => void
  onCloseOverlay?: () => void
  onAddScroll?: () => void
}

type IconComp = ComponentType<{ className?: string; strokeWidth?: number }>

const DOCKS: { id: OverlayDock; icon: IconComp; label: string }[] = [
  { id: 'left', icon: PanelLeftIcon, label: 'Left' },
  { id: 'right', icon: PanelRightIcon, label: 'Right' },
  { id: 'top', icon: PanelTopIcon, label: 'Top' },
  { id: 'bottom', icon: PanelBottomIcon, label: 'Bottom' },
]

const REVEAL: { id: OverlayRevealMethod; label: string }[] = [
  { id: 'edge', label: 'Move to edge' },
  { id: 'button', label: 'Arrow / button' },
  { id: 'both', label: 'Both' },
]

export default function OverlayControlRail({
  settings,
  onSettingsChange,
  onOpenInApp,
  onCloseOverlay,
  onAddScroll,
}: Props) {
  const [menu, setMenu] = useState<'dock' | 'reveal' | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const vertical = isVerticalDock(settings.dock)

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setMenu(null)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const CollapseIcon: IconComp =
    settings.dock === 'right'
      ? ChevronRightIcon
      : settings.dock === 'top'
        ? ChevronUpIcon
        : settings.dock === 'bottom'
          ? ChevronDownIcon
          : ChevronLeftIcon

  const AutoHideIcon: IconComp =
    settings.dock === 'right'
      ? PanelRightCloseIcon
      : settings.dock === 'top'
        ? PanelTopCloseIcon
        : settings.dock === 'bottom'
          ? PanelBottomCloseIcon
          : PanelLeftCloseIcon

  const DockIcon = DOCKS.find(d => d.id === settings.dock)?.icon ?? PanelLeftIcon

  const divider = vertical
    ? 'mx-0.5 my-0.5 border-t border-[#3E3E11]'
    : 'mx-0.5 my-0.5 border-l border-[#3E3E11]'

  return (
    <div
      ref={rootRef}
      className={`flex gap-0.5 rounded border-2 border-[#3E3E11] bg-[#120413]/95 p-1 shadow-lg ${
        vertical ? 'flex-col' : 'flex-row'
      }`}
      data-questhub-overlay-hit=""
      role="toolbar"
      aria-label="Overlay controls"
    >
      <RailBtn title="Hide overlay" onClick={() => onSettingsChange({ collapsed: true })}>
        <CollapseIcon className="size-3.5" strokeWidth={2} />
      </RailBtn>

      <div className={divider} />

      {onAddScroll && (
        <RailBtn title="Add scroll (paste screenshot or pick type)" onClick={onAddScroll}>
          <PlusIcon className="size-3.5" strokeWidth={2} />
        </RailBtn>
      )}

      <RailBtn
        title={settings.autoHide ? 'Auto-hide on' : 'Auto-hide off'}
        active={settings.autoHide}
        onClick={() => onSettingsChange({ autoHide: !settings.autoHide })}
      >
        <AutoHideIcon className="size-3.5" strokeWidth={1.75} />
      </RailBtn>

      <div className="relative">
        <RailBtn
          title="Panel position"
          active={menu === 'dock'}
          onClick={() => setMenu(m => (m === 'dock' ? null : 'dock'))}
        >
          <DockIcon className="size-3.5" strokeWidth={1.75} />
        </RailBtn>
        {menu === 'dock' && (
          <MenuFlyout vertical={vertical}>
            {DOCKS.map(({ id, icon: Icon, label }) => (
              <MenuItem
                key={id}
                label={label}
                active={settings.dock === id}
                onClick={() => {
                  onSettingsChange({ dock: id, collapsed: false })
                  setMenu(null)
                }}
              >
                <Icon className="size-3.5" strokeWidth={1.75} />
              </MenuItem>
            ))}
          </MenuFlyout>
        )}
      </div>

      <div className="relative">
        <RailBtn
          title="Reveal method"
          active={menu === 'reveal'}
          onClick={() => setMenu(m => (m === 'reveal' ? null : 'reveal'))}
        >
          <ChevronRightIcon className="size-3.5" strokeWidth={2} />
        </RailBtn>
        {menu === 'reveal' && (
          <MenuFlyout vertical={vertical}>
            {REVEAL.map(r => (
              <MenuItem
                key={r.id}
                label={r.label}
                active={settings.revealMethod === r.id}
                onClick={() => {
                  onSettingsChange({ revealMethod: r.id })
                  setMenu(null)
                }}
              />
            ))}
          </MenuFlyout>
        )}
      </div>

      <div className={divider} />

      <RailBtn title="Open in app" onClick={onOpenInApp}>
        <AppWindowIcon className="size-3.5" strokeWidth={1.75} />
      </RailBtn>

      {onCloseOverlay && (
        <RailBtn title="Close overlay" onClick={onCloseOverlay}>
          <XIcon className="size-3.5" strokeWidth={2} />
        </RailBtn>
      )}
    </div>
  )
}

function RailBtn({
  children,
  title,
  onClick,
  active,
}: {
  children: React.ReactNode
  title: string
  onClick: () => void
  active?: boolean
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="cursor-pointer flex size-8 items-center justify-center rounded border transition-colors"
      style={{
        color: active ? '#FCFC40' : '#A9A1A8',
        borderColor: active ? '#FCFC40' : 'transparent',
        background: active ? '#FCFC4022' : 'transparent',
      }}
    >
      {children}
    </button>
  )
}

function MenuItem({
  children,
  label,
  onClick,
  active,
}: {
  children?: React.ReactNode
  label: string
  onClick: () => void
  active?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="cursor-pointer flex w-full items-center gap-2 rounded px-2 py-1.5 text-left font-pixeloid-sans text-xs hover:bg-white/10"
      style={{ color: active ? '#FCFC40' : '#A9A1A8' }}
    >
      {children}
      <span>{label}</span>
    </button>
  )
}

function MenuFlyout({
  children,
  vertical,
}: {
  children: React.ReactNode
  vertical: boolean
}) {
  return (
    <div
      className={`absolute z-50 flex min-w-[9rem] flex-col gap-0.5 rounded border-2 border-[#3E3E11] bg-[#120413] p-1 shadow-lg ${
        vertical ? 'left-full top-0 ml-1' : 'top-full left-0 mt-1'
      }`}
      data-questhub-overlay-hit=""
    >
      {children}
    </div>
  )
}
