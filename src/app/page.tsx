import Image from "next/image";

const foundationChecks = [
  "Next.js App Router",
  "TypeScript",
  "Tailwind CSS",
  "ESLint + Prettier",
  "Vitest + React Testing Library",
];

export default function Home() {
  return (
    <main className="min-h-screen px-6 py-8 text-[#121417] sm:px-10">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl grid-cols-1 overflow-hidden border border-[#d7dde8] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.12)] lg:grid-cols-[280px_1fr]">
        <aside className="flex flex-col gap-8 border-b border-[#d7dde8] bg-[#f8fafc] p-6 lg:border-r lg:border-b-0">
          <div className="flex items-center gap-3">
            <Image
              src="/orbit-logo.svg"
              alt="Orbit forum logo"
              width={44}
              height={44}
              className="h-11 w-11"
            />
            <div>
              <p className="text-sm font-semibold text-[#0f766e]">HW5</p>
              <p className="text-xl font-black">Orbit</p>
            </div>
          </div>

          <nav aria-label="Phase 1 navigation preview" className="grid gap-2">
            {["Home", "Profile", "Post"].map((item) => (
              <span
                key={item}
                className="rounded-md px-4 py-3 text-sm font-bold text-[#344054]"
              >
                {item}
              </span>
            ))}
          </nav>

          <div className="mt-auto rounded-md border border-[#d7dde8] bg-white p-4">
            <p className="text-xs font-bold uppercase text-[#667085]">
              Phase 1
            </p>
            <p className="mt-1 text-sm font-semibold">Foundation only</p>
          </div>
        </aside>

        <section className="flex flex-col justify-center p-6 sm:p-10 lg:p-14">
          <p className="text-sm font-bold uppercase text-[#0f766e]">
            Boot check
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-black leading-tight sm:text-6xl">
            Phase 1 Next.js foundation is running.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-[#475467]">
            This placeholder confirms the app boots with the selected workflow.
            Authentication, profiles, posting, feeds, persistence, and realtime
            updates are reserved for later phases.
          </p>

          <div className="mt-10 grid gap-3 sm:grid-cols-2">
            {foundationChecks.map((check) => (
              <div
                key={check}
                className="rounded-md border border-[#d7dde8] bg-[#f8fafc] px-4 py-3 text-sm font-bold text-[#1d2939]"
              >
                {check}
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
