export default function BrandPanel() {
  return (
    <aside className="relative flex min-h-screen flex-col overflow-hidden bg-forest bg-[radial-gradient(circle,rgba(231,239,218,0.13)_0.7px,transparent_0.7px)] bg-[size:19px_19px] px-[clamp(32px,5vw,76px)] pt-[42px] pb-[30px] text-paper before:pointer-events-none before:absolute before:inset-0 before:z-0 before:bg-[linear-gradient(135deg,rgba(15,43,35,0.05),rgba(15,43,35,0.55))] before:content-[''] max-[860px]:px-[30px] max-[650px]:hidden">
      <a className="relative z-10 inline-flex w-fit items-center gap-[11px] text-inherit no-underline" href="/" aria-label="Commonroom home">
        <span className="grid size-[31px] place-items-center rounded-full border border-current font-display text-[22px] leading-none font-normal">c</span>
        <span>commonroom</span>
      </a>

      <div className="relative z-10 mt-[clamp(70px,12vh,130px)] max-w-[440px]">
        <p className="mb-[18px] text-[11px] leading-[1.3] font-bold text-leaf uppercase">A little more in sync</p>
        <h1 className="m-0 font-display text-[clamp(44px,5vw,68px)] leading-[1.04] font-normal">Good work<br />starts <em className="font-normal text-leaf">together.</em></h1>
        <p className="mt-[22px] max-w-[320px] text-[15px] leading-[1.7] text-paper/70">A quieter place to bring your people, plans, and next big ideas together.</p>
      </div>

      <div className="relative z-10 my-auto mb-6 aspect-square w-[min(82%,350px)] self-center max-[860px]:w-[min(95%,290px)]" aria-hidden="true">
        <span className="absolute top-1/2 left-1/2 size-[42%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-paper/30" />
        <span className="absolute top-1/2 left-1/2 size-[70%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-paper/30" />
        <span className="absolute top-1/2 left-1/2 size-[98%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-paper/20" />
        <span className="absolute top-1/2 left-1/2 grid size-[20%] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-paper/65"><span className="size-[43%] rounded-full bg-leaf" /></span>
        <span className="absolute right-0 bottom-[5%] text-[9px] font-bold text-paper/60">MADE FOR THE IN-BETWEEN</span>
      </div>

      <div className="relative z-10 flex items-center gap-[9px] text-[11px] text-paper/70">
        <span className="size-[7px] rounded-full bg-leaf" />
        <span>Your space is waiting</span>
        <span className="ml-auto text-[9px]">EST. 2025</span>
      </div>
    </aside>
  )
}