// src/components/layout/TopBarNoLogin.tsx
type TopBarNoLoginProps = {
  titleMinor: string
  title: string
  primaryColor?: string  // ← novo
}

export default function TopBarNoLogin({ titleMinor, title, primaryColor }: TopBarNoLoginProps) {
  return (
    <header
      className="flex justify-between items-center w-full px-8 py-4 sticky top-0 z-40 backdrop-blur-md border-b border-outline-variant/50 shadow-sm transition-all duration-200 ease-in-out"
      style={primaryColor ? { backgroundColor: primaryColor } : undefined}
    >
      <div className="flex flex-col gap-1">
        <span className="text-xs font-bold text-white/70 uppercase tracking-[0.2em] font-outfit">
          {titleMinor}
        </span>
        <h2 className="text-xl font-extrabold text-white font-outfit tracking-tight">
          {title}
        </h2>
      </div>
    </header>
  )
}
