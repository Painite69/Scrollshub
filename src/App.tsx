import { useState, useEffect } from 'react'
import Header from './components/Header'
import Router from './router'

// ── Wallpaper definitions ─────────────────────────────────────────────────────

const WALLPAPERS = [
  {
    id: 'bee',
    label: 'Baby Bee',
    thumb: '/wallpapers/wallpaper_baby%20bee/wallpaper_tiny_takeover_bee_800x450.png',
    url: '/wallpapers/wallpaper_baby%20bee/wallpaper_tiny_takeover_bee_1920x1080.png',
  },
  {
    id: 'axolotl',
    label: 'Baby Axolotl',
    thumb: '/wallpapers/wallpaper_baby%20axolotl/wallpaper_tiny_takeover_axo_800x450.png',
    url: '/wallpapers/wallpaper_baby%20axolotl/wallpaper_tiny_takeover_axo_1920x1080.png',
  },
  {
    id: 'ghast',
    label: 'Happy Ghast',
    thumb: '/wallpapers/wallpapers_chase_the_skies_update/MCV_SummerDrop_Hero_DotNet_Downloadable_Wallpaper_r800x450.png',
    url: '/wallpapers/wallpapers_chase_the_skies_update/MCV_SummerDrop_Hero_DotNet_Downloadable_Wallpaper_r1920x1080.png',
  },
  {
    id: 'copper',
    label: 'Copper Golem',
    thumb: '/wallpapers/wallpapers_the_copper_age_drop-1/Minecraft_Fall_Drop_Campaign_Key_Art_DotNet_Downloadable_Wallpaper_800x450.png',
    url: '/wallpapers/wallpapers_the_copper_age_drop-1/Minecraft_Fall_Drop_Campaign_Key_Art_DotNet_Downloadable_Wallpaper_1920x1080.png',
  },
  {
    id: 'creekings',
    label: 'Pale Garden',
    thumb: '/wallpapers/wallpapers_the_garden_awakens_update/Minecraft_TheGardenAwakens_DotNet_1920x1080.png',
    url: '/wallpapers/wallpapers_the_garden_awakens_update/Minecraft_TheGardenAwakens_DotNet_1920x1080.png',
  },
]

const STORAGE_KEY = 'questhub_wallpaper'

// ── BG picker panel ───────────────────────────────────────────────────────────

function BgPicker({ current, onSelect, onClose }: {
  current: string
  onSelect: (id: string) => void
  onClose: () => void
}) {
  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />
      {/* Panel */}
      <div className="fixed bottom-16 right-4 z-50 flex flex-col gap-3 rounded border-2 border-[#190A21] bg-[#120413]/95 p-4 w-72 shadow-2xl">
        <span className="font-exe-pixel text-sm text-[#FCFC40]">Choose Background</span>
        <div className="grid grid-cols-2 gap-2">
          {WALLPAPERS.map(wp => {
            const active = current === wp.id
            return (
              <button
                key={wp.id}
                onClick={() => { onSelect(wp.id); onClose() }}
                className="cursor-pointer flex flex-col gap-1 rounded border-2 overflow-hidden transition-all hover:scale-[1.02]"
                style={{ borderColor: active ? '#FCFC40' : '#190A21' }}
              >
                {wp.thumb ? (
                  <img src={wp.thumb} alt={wp.label} className="w-full h-16 object-cover" />
                ) : (
                  <div className="w-full h-16 bg-[#0a0010] flex items-center justify-center">
                    <span className="font-pixeloid-sans text-xs text-white/30">No BG</span>
                  </div>
                )}
                <span
                  className="font-pixeloid-sans text-xs px-1 pb-1 text-center w-full"
                  style={{ color: active ? '#FCFC40' : '#A9A1A8' }}
                >
                  {wp.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </>
  )
}

// ── App ───────────────────────────────────────────────────────────────────────

function App() {
  const [wallpaperId, setWallpaperId] = useState<string>(() =>
    localStorage.getItem(STORAGE_KEY) ?? 'bee'
  )
  const [pickerOpen, setPickerOpen] = useState(false)

  const wallpaper = WALLPAPERS.find(w => w.id === wallpaperId) ?? WALLPAPERS[0]

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, wallpaperId)
  }, [wallpaperId])

  return (
    <div
      className="flex flex-col min-h-screen bg-cover bg-center bg-no-repeat"
      style={wallpaper.url ? { backgroundImage: `url('${wallpaper.url}')` } : undefined}
    >
      <Header />
      <Router />

      {/* BG picker button — fixed bottom-right, above everything */}
      <button
        onClick={() => setPickerOpen(v => !v)}
        title="Change background"
        className="fixed bottom-4 right-4 z-50 cursor-pointer rounded border-2 border-[#3E3E11] bg-[#120413] px-1 pt-5 pb-2 font-exe-pixel text-5xl sm:text-6xl text-[#FCFC40] hover:border-[#FCFC40] hover:bg-[#1e1a00] transition-colors shadow-lg"
      >
        🌆
      </button>

      {pickerOpen && (
        <BgPicker
          current={wallpaperId}
          onSelect={setWallpaperId}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  )
}

export default App
