import { Link } from 'react-router-dom'

/** Windows installer hosted on GitHub Releases (too large for the site CDN). */
const DESKTOP_DOWNLOAD_URL =
  'https://github.com/Painite69/Scrollshub/releases/download/v0.1.1/ScrollsHub-Setup-0.1.1.exe'

function Header() {
  const isDesktop = Boolean(window.questHubDesktop?.isDesktop)

  return (
    <div className="flex flex-wrap justify-between gap-3 p-3 sm:p-6 bg-black/20">
      <Link className="flex items-center gap-2 cursor-pointer" to="/">
        <img src="/custom_assets/logo.webp" alt="" className="w-8 sm:w-[60px]"/>
        <h1 className="font-exe-pixel text-white text-3xl sm:text-6xl">ScrollsHub</h1>
      </Link>
      
      <div className="flex flex-wrap items-center gap-2 sm:gap-4 font-exe-pixel text-xl sm:text-4xl">
        <Link to="/" className="cursor-pointer text-white hover:text-black/30 hover:scale-110">Scrolls</Link>
        <Link to="/battle-pass" className="cursor-pointer text-white hover:text-black/30 hover:scale-110">BattlePass</Link>
        {!isDesktop && (
          <a
            href={DESKTOP_DOWNLOAD_URL}
            className="cursor-pointer text-[#FCFC40] hover:text-black/30 hover:scale-110"
            download
          >
            Download
          </a>
        )}
        {isDesktop && (
          <button
            type="button"
            onClick={() => window.questHubDesktop?.toggleOverlay()}
            className="cursor-pointer text-[#00A8A8] hover:text-[#FCFC40] hover:scale-110"
            title="Toggle overlay (Ctrl+Shift+O)"
          >
            Overlay
          </button>
        )}
        <a href="https://vulengate.com/vote" className="cursor-pointer text-white hover:text-black/30 hover:scale-110" target="blank">Vote</a>
        <Link to="/about" className="cursor-pointer text-white hover:text-black/30 hover:scale-110">About</Link>
        <Link to="/privacy-policy" className="cursor-pointer text-white hover:text-black/30 hover:scale-110">Privacy</Link>

        <a className="cursor-pointer hover:scale-110" href="https://www.twitch.tv/thecolorofboom" target="blank">
          <img src="/custom_assets/stream.webp" alt="" className="w-8 sm:w-[50px]"/>
        </a>
        <a className="cursor-pointer hover:scale-110" href="https://discord.gg/WZwFjte2qE" target="blank">
          <img src="/custom_assets/discord.webp" alt="" className="w-8 sm:w-[50px]"/>
        </a>
        <a className="cursor-pointer hover:scale-110" href="https://ko-fi.com/painitedevelopment" target="blank">
          <img src="/custom_assets/kofi.webp" alt="" className="w-8 sm:w-[50px]"/>
        </a>
        
      </div>
    </div>
  );
}

export default Header;
