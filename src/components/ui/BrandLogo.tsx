interface BrandLogoProps {
  compact?: boolean;
  inverse?: boolean;
}

export function BrandLogo({ compact = false, inverse = false }: BrandLogoProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 32 32" fill="none" className="h-7 w-7">
          <path d="M8.5 9.5c3.8-3.8 11.2-3.8 15 0" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
          <path d="M7 15.5c4.8-3.9 13.2-3.9 18 0" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
          <path d="M10 21.5c3.2-2.1 8.8-2.1 12 0" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
          <circle cx="16" cy="26" r="2" fill="currentColor" />
        </svg>
      </div>
      {!compact && (
        <div className="leading-none">
          <div className={`text-[18px] font-extrabold tracking-tight ${inverse ? 'text-white' : 'text-slate-950 dark:text-white'}`}>
            Fisio<span className={inverse ? 'text-emerald-200' : 'text-primary'}>Admin</span>
          </div>
          <div className={`mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${inverse ? 'text-white/55' : 'text-slate-400 dark:text-slate-500'}`}>
            Gestión clínica
          </div>
        </div>
      )}
    </div>
  );
}
