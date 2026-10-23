import BrandPanel from './BrandPanel.jsx'

export default function AuthLayout({ children }) {
  return (
    <main className="grid min-h-screen grid-cols-[minmax(360px,0.92fr)_minmax(500px,1.08fr)] bg-page text-ink max-[860px]:grid-cols-[minmax(285px,0.8fr)_minmax(400px,1.2fr)] max-[650px]:flex max-[650px]:min-h-screen max-[650px]:flex-col">
      <BrandPanel />
      <section className="flex min-h-screen flex-col items-center px-[clamp(24px,5vw,72px)] pt-10 pb-[25px] max-[860px]:px-[35px] max-[650px]:min-h-screen max-[650px]:items-stretch max-[650px]:px-[23px] max-[650px]:pt-[25px] max-[650px]:pb-[19px] max-[370px]:px-[17px]" aria-label="Account access">
        <a className="hidden w-fit items-center gap-[11px] text-[14px] font-bold text-forest no-underline max-[650px]:inline-flex" href="/" aria-label="Commonroom home">
          <span className="grid size-[29px] place-items-center rounded-full border border-current font-display text-[22px] leading-none font-normal">c</span>
          <span>commonroom</span>
        </a>
        <div className="my-auto w-full max-w-[440px] animate-enter py-[55px] max-[650px]:py-[45px]">{children}</div>
        <footer className="flex w-full max-w-[440px] justify-between gap-[14px] text-[10px] text-[#8a938c] max-[650px]:mt-auto">
          <span>© 2025 Commonroom</span>
          <a className="no-underline hover:text-forest hover:underline hover:underline-offset-[3px]" href="mailto:support@commonroom.app">Need a hand?</a>
        </footer>
      </section>
    </main>
  )
}