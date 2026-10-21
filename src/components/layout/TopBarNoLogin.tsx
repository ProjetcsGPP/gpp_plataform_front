// src/components/layout/TopBarNoLogin.tsx
type TopBarNoLoginProps = {
  titleMinor: string
  title: string
}

export default function TopBarNoLogin({ titleMinor, title }: TopBarNoLoginProps) {
  return (
    <header
      className="sticky top-0 z-40 flex w-full items-center justify-between border-b border-app-accent/40 bg-app-primary px-8 py-4 text-app-primary-text shadow-sm transition-colors duration-200 ease-in-out"
    >
      <div className="flex flex-col gap-1">
        <span className="font-outfit text-xs font-bold uppercase tracking-[0.2em] opacity-70">
          {titleMinor}
        </span>
        <h2 className="font-outfit text-xl font-extrabold tracking-tight">
          {title}
        </h2>
      </div>
    </header>
  )
}
