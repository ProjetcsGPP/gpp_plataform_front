'use client'

type TopBarNoLoginProps = {
  titleMinor: string;
  title: string
}

export default function TopBarNoLogin({ titleMinor, title }: TopBarNoLoginProps) {
  return (
    <header className="flex justify-between items-center w-full px-8 py-4 sticky top-0 z-40 bg-surface-container-lowest/80 backdrop-blur-md border-b border-outline-variant/50 shadow-sm transition-all duration-200 ease-in-out">

      <div className="flex flex-col gap-1">
        <span className="text-xs font-bold text-blue-900/60 uppercase tracking-[0.2em] font-outfit">
          {titleMinor}
        </span>
        <h2 className="text-xl font-extrabold text-blue-900 font-outfit tracking-tight">
          {title}
        </h2>
      </div>

    </header>
  )
}