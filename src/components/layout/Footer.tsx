export function Footer() {
  const version = __APP_VERSION__;
  const year = new Date().getFullYear();

  return (
    <footer className="mt-10 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 py-6 text-sm text-gray-500">
          <p>
            <span className="font-semibold text-primary-dark">FisioAdmin</span> · Sistema de Gestión para Clínicas de Fisioterapia
          </p>
          <div className="flex items-center gap-3">
            <span>© {year} Todos los derechos reservados</span>
            <span className="inline-flex items-center rounded-full bg-primary-light px-2.5 py-0.5 text-xs font-medium text-primary-dark">
              v{version}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
