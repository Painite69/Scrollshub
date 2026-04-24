function Header() {
  return (
    <div className="flex flex-wrap justify-between gap-3 p-3 sm:p-6 bg-black/20">
      <a className="flex items-center gap-2 cursor-pointer" href="/">
        <img src="/custom_assets/logo.webp" alt="" className="w-8 sm:w-[60px]"/>
        <h1 className="font-exe-pixel text-white text-3xl sm:text-6xl">ScrollsHub</h1>
      </a>
      
      <div className="flex flex-wrap items-center gap-2 sm:gap-4 font-exe-pixel text-xl sm:text-4xl">
        <a href="/" className="cursor-pointer text-white hover:text-black/30 hover:scale-110">Scrolls</a>
        <a href="/battle-pass" className="cursor-pointer text-white hover:text-black/30 hover:scale-110">BattlePass</a>
        <a href="/about" className="cursor-pointer text-white hover:text-black/30 hover:scale-110">About</a>
        <a href="/privacy-policy" className="cursor-pointer text-white hover:text-black/30 hover:scale-110">Privacy</a>
        <a className="cursor-pointer hover:scale-110" href="https://ko-fi.com/painitedevelopment" target="blank">
          <img src="/custom_assets/kofi.webp" alt="" className="w-8 sm:w-[50px]"/>
        </a>
        <a className="cursor-pointer hover:scale-110" href="https://discord.gg/WZwFjte2qE" target="blank">
          <img src="/custom_assets/discord.webp" alt="" className="w-8 sm:w-[50px]"/>
        </a>
      </div>
    </div>
  );
}

export default Header;
