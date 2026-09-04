export function Footer() {
  const version = __APP_VERSION__;
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200 bg-white dark:bg-slate-950 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 py-4 text-xs text-slate-400">
          <p>
            <span className="font-bold text-primary-dark dark:text-primary">FisioAdmin</span> · Gestión clínica inteligente
          </p>
          <div className="flex items-center gap-3">
            <span>© {year} Todos los derechos reservados</span>
            <span className="inline-flex items-center rounded-full bg-primary-light px-2.5 py-0.5 text-[10px] font-bold text-primary-dark">
              v{version}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
