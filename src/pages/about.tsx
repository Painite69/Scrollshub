function About() {
  return (
    <div className="flex flex-col gap-10 px-4 py-8 sm:px-8 mx-auto fade-in">

      {/* ── Hero ── */}
      <div className="flex flex-col bg-black/30 rounded p-4 sm:flex-row items-center gap-6">
        <img
          src="https://mc-heads.net/body/_Painite_/"
          alt="_Painite_"
          className="w-24 sm:w-18 shrink-0 pixelated"
        />
        <div className="flex flex-col gap-3 text-center sm:text-left">
          <h1 className="font-exe-pixel text-3xl sm:text-5xl text-[#FCFC40]">About</h1>
          <p className="font-pixeloid-sans text-sm text-white leading-relaxed">
            {/* ← your intro text here */}
            Hi, I'm Painite ign:_Painite_. I create websites and apps based on the things I love, and to show appreciation to their communities.
          </p>
        </div>
      </div>

      {/* ── Divider ── */}
      <div className="border-t  border-white/10" />

      {/* ── About the app ── */}
      <section className="flex flex-col bg-black/30 rounded p-4 gap-3">
        <h2 className="font-exe-pixel text-xl text-[#F755ED]">What is ScrollsHub?</h2>
        <p className="font-pixeloid-sans text-sm text-white leading-relaxed">
          {/* ← describe the app here */}
          ScrollsHub is a Vulengate scrolls and battlepass tracker, to help you organize your scrolls and track your progress.
        </p>
      </section>

      {/* ── Features ── */}
      <section className="flex flex-col bg-black/30 rounded p-4 gap-3">
        <h2 className="font-exe-pixel text-xl text-[#64FC65]">Features</h2>
        <ul className="flex flex-col gap-2">
          {[
            'Separate Scrolls — You can add all your scrolls and track them separately.',
            'Categorized Scrolls — You can have your scrolls organized by categories based on their type.',
            'Battlepass Tracker — Keep track of your battlepass progress, including weekly quests, achievements goals, and daily quests.',
          ].map((f, i) => (
            <li key={i} className="flex items-start gap-2 font-pixeloid-sans text-sm text-white">
              <span className="text-[#64FC65] shrink-0">▸</span>
              {f}
            </li>
          ))}
        </ul>
      </section>

      {/* ── Divider ── */}
      <div className="border-t border-white/10" />

      {/* ── Links ── */}
      <section className="flex flex-col bg-black/30 rounded p-4 gap-3">
        <h2 className="font-exe-pixel text-xl text-[#FCA900]">Links</h2>
        <div className="flex flex-col gap-3">
          <p className="font-pixeloid-sans text-sm text-white">Would love to have you on stream and feel free to join the discord and give me feedback on what to improve.</p>
          <div className="flex gap-2">
            <a
              href="https://www.twitch.tv/thecolorofboom"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded border-2 border-[#8652f6] bg-[#120413] px-4 py-2 font-exe-pixel text-sm text-[#8652f6] hover:border-[#c68ff3] hover:text-[#c68ff3] transition-colors"
            >
              <img src="/custom_assets/stream.webp" alt="Twitch" className="w-5 h-5" />
              Twitch
            </a>
            <a
              href="https://discord.gg/WZwFjte2qE"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded border-2 border-[#6665d2] bg-[#120413] px-4 py-2 font-exe-pixel text-sm text-[#6665d2] hover:border-[#aeadfe] hover:text-[#aeadfe] transition-colors"
            >
              <img src="/custom_assets/discord.webp" alt="Discord" className="w-5 h-5" />
              Discord
            </a>
            <a
              href="https://ko-fi.com/painitedevelopment"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded border-2 border-[#00b9fe] bg-[#120413] px-4 py-2 font-exe-pixel text-sm text-[#00b9fe] hover:border-[#6bd7ff] hover:text-[#6bd7ff] transition-colors"
            >
              <img src="/custom_assets/kofi.webp" alt="Ko-fi" className="w-5 h-5" />
              Ko-fi
            </a>
          </div>
            
        </div>
      </section>

    </div>
  )
}

export default About
