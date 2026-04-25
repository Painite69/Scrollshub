function PrivacyPolicy() {
  return (
    <div className="mt-6 flex flex-col bg-black/30 gap-8 px-4 py-8 sm:px-8 max-w-3xl mx-auto">

      <div className="flex flex-col gap-2">
        <h1 className="font-exe-pixel text-3xl sm:text-5xl text-[#FCFC40]">Privacy Policy</h1>
        <p className="font-pixeloid-sans text-xs text-white">
          Last updated: April 2026
        </p>
      </div>

      <div className="border-t border-white/10" />

      <section className="flex flex-col gap-3">
        <h2 className="font-exe-pixel text-4xl text-[#F755ED]">1. Overview</h2>
        <p className="font-pixeloid-sans text-sm text-white leading-relaxed">
          ScrollsHub is a free, browser-based Minecraft scroll tracker. We are committed to your privacy.
          This policy explains what data is collected, where it lives, and how it is used.
          The short version: your quest data never leaves your device, and we do not sell or share any personal information.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-exe-pixel text-4xl text-[#64FC65]">2. Data You Create</h2>
        <p className="font-pixeloid-sans text-sm text-white leading-relaxed">
          All data you create in ScrollsHub — quest groups, scrolls, quests, battle pass progress,
          category order preferences, and your chosen background wallpaper — is stored exclusively
          in your browser's <span className="text-[#64FC65]">localStorage</span>. This data:
        </p>
        <ul className="flex flex-col gap-2 mt-1">
          {[
            'Never leaves your device.',
            'Is never transmitted to any server.',
            'Is never shared with any third party.',
            'Can be cleared at any time by clearing your browser\'s site data.',
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2 font-pixeloid-sans text-sm text-white">
              <span className="text-[#64FC65] shrink-0">▸</span>
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-exe-pixel text-4xl text-[#FCA900]">3. Hosting & Analytics</h2>
        <p className="font-pixeloid-sans text-sm text-white leading-relaxed">
          ScrollsHub is hosted on <span className="text-[#FCA900]">Cloudflare Pages</span>. As part of serving the site,
          Cloudflare may collect basic, anonymised web analytics such as page views, referrer URLs,
          browser type, and country-level location. This data is aggregated, contains no personally
          identifiable information, uses no cookies, and is governed by{' '}
          <a
            href="https://www.cloudflare.com/privacypolicy/"
            target="_blank"
            rel="noreferrer"
            className="text-[#FCA900] hover:underline"
          >
            Cloudflare's Privacy Policy
          </a>.
          We do not use Google Analytics, any advertising networks, or any other tracking services.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-exe-pixel text-4xl text-[#3399FF]">4. Cookies</h2>
        <p className="font-pixeloid-sans text-sm text-white leading-relaxed">
          ScrollsHub does not set any cookies. Your preferences are stored in localStorage,
          which is a different browser mechanism that is not transmitted with HTTP requests
          and is not accessible to third parties.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-exe-pixel text-4xl text-[#AA00FF]">5. Children's Privacy</h2>
        <p className="font-pixeloid-sans text-sm text-white leading-relaxed">
          ScrollsHub does not knowingly collect any personal information from anyone, including children.
          Since all data is stored locally on the user's own device and nothing is transmitted to us,
          there is no personal data for us to collect or process.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-exe-pixel text-4xl text-[#FCFC40]">6. Changes to This Policy</h2>
        <p className="font-pixeloid-sans text-sm text-white leading-relaxed">
          If this policy changes, the updated version will be posted on this page with a revised date.
          Since we collect no personal data, changes are unlikely to affect you in any meaningful way.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-exe-pixel text-4xl text-[#FF3333]">7. Contact</h2>
        <p className="font-pixeloid-sans text-sm text-white leading-relaxed">
          If you have any questions about this privacy policy, reach out on{' '}
          <a
            href="https://discord.gg/WZwFjte2qE"
            target="_blank"
            rel="noreferrer"
            className="text-[#3399FF] hover:underline"
          >
            Discord
          </a>.
        </p>
      </section>

    </div>
  )
}

export default PrivacyPolicy
