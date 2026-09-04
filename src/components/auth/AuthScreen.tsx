import { useState, FormEvent } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ThemeToggle } from '../ui/ThemeToggle';
import { BrandLogo } from '../ui/BrandLogo';

type Mode = 'login' | 'register';

export function AuthScreen() {
  const { login, register, error: authError } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    if (!email || !password) {
      setError('Ingresa tu correo y contraseña');
      return;
    }
    if (mode === 'register' && !displayName) {
      setError('Ingresa tu nombre');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    setSubmitting(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(email, password, displayName);
        setInfo('Registro exitoso. Tu cuenta quedará pendiente de aprobación por el administrador antes de poder acceder.');
      }
    } catch (err: any) {
      setError(err?.message?.startsWith('Esta cuenta fue eliminada') ? err.message : translateError(err?.code));
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = "input h-12";
  const labelClass = "label";

  return (
    <main className="min-h-screen bg-[#eef5f4] dark:bg-slate-950 lg:grid lg:grid-cols-[1.08fr_.92fr]">
      <section className="relative hidden overflow-hidden bg-[#073f3c] p-12 text-white lg:flex lg:flex-col lg:justify-between xl:p-16">
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-teal-300/10 blur-3xl" />
        <div className="absolute -bottom-28 left-12 h-80 w-80 rounded-full bg-cyan-300/10 blur-3xl" />
        <BrandLogo inverse />

        <div className="relative max-w-xl py-12">
          <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-emerald-100 backdrop-blur">
            Hecho para clínicas de fisioterapia
          </span>
          <h1 className="mt-6 text-4xl font-extrabold leading-[1.08] tracking-[-0.04em] xl:text-5xl">
            Más tiempo para tus pacientes. <span className="text-emerald-200">Menos para administrar.</span>
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-white/68">
            Organiza expedientes, citas, tratamientos, evolución clínica y finanzas desde un solo lugar.
          </p>

          <div className="mt-10 grid grid-cols-3 gap-3">
            {[
              ['Agenda', 'Siempre al día'],
              ['Expedientes', 'Todo conectado'],
              ['Métricas', 'Decide mejor'],
            ].map(([title, detail]) => (
              <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur-sm">
                <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-200 text-[#075e56]">
                  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2">
                    <path d="m7 12 3 3 7-7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <p className="text-sm font-bold">{title}</p>
                <p className="mt-1 text-xs text-white/50">{detail}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-white/40">Información clara para una atención más humana.</p>
      </section>

      <section className="relative flex min-h-screen items-center justify-center p-5 sm:p-10">
        <div className="absolute right-5 top-5 sm:right-8 sm:top-8"><ThemeToggle /></div>
        <div className="w-full max-w-md animate-fade-in">
          <div className="mb-10 lg:hidden"><BrandLogo /></div>
          <div className="mb-7">
            <p className="eyebrow">{mode === 'login' ? 'Bienvenido de nuevo' : 'Empieza hoy'}</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white">
              {mode === 'login' ? 'Accede a tu clínica' : 'Crea tu cuenta'}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
              {mode === 'login' ? 'Ingresa tus datos para continuar donde lo dejaste.' : 'Centraliza la operación diaria de tu clínica.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
          {error && <div className="p-3 bg-danger-light border border-danger text-danger rounded-lg text-sm">{error}</div>}
          {authError && <div className="p-3 bg-danger-light border border-danger text-danger rounded-lg text-sm">{authError}</div>}
          {info && <div className="p-3 bg-secondary-light border border-secondary text-secondary-dark rounded-lg text-sm">{info}</div>}

          {mode === 'register' && (
            <div>
              <label className={labelClass}>Nombre completo <span className="text-danger">*</span></label>
              <input required className={inputClass} value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Tu nombre" />
            </div>
          )}

          <div>
            <label className={labelClass}>Correo electrónico <span className="text-danger">*</span></label>
            <input required type="email" className={inputClass} value={email} onChange={e => setEmail(e.target.value)} placeholder="correo@ejemplo.com" />
          </div>

          <div>
            <label className={labelClass}>Contraseña <span className="text-danger">*</span></label>
            <input required type="password" className={inputClass} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary h-12 w-full shadow-brand disabled:opacity-60"
          >
            {submitting ? 'Procesando...' : mode === 'login' ? 'Iniciar sesión' : 'Registrarse'}
          </button>
          </form>

          <div className="mt-7 text-center text-sm text-slate-500 dark:text-slate-400">
          {mode === 'login' ? (
            <p>¿No tienes cuenta?{' '}
              <button className="font-semibold text-primary hover:text-primary-hover" onClick={() => { setMode('register'); setError(''); setInfo(''); }}>
                Regístrate
              </button>
            </p>
          ) : (
            <p>¿Ya tienes cuenta?{' '}
              <button className="font-semibold text-primary hover:text-primary-hover" onClick={() => { setMode('login'); setError(''); setInfo(''); }}>
                Inicia sesión
              </button>
            </p>
          )}
          </div>
          <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-400">
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2"><path d="M7 10V8a5 5 0 0 1 10 0v2M6 10h12v10H6z" strokeLinecap="round" strokeLinejoin="round" /></svg>
            Tus datos están protegidos
          </div>
        </div>
      </section>
    </main>
  );
}

function translateError(code?: string): string {
  switch (code) {
    case 'auth/invalid-email':
      return 'El correo no es válido.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Correo o contraseña incorrectos.';
    case 'auth/email-already-in-use':
      return 'Este correo ya está registrado.';
    case 'auth/weak-password':
      return 'La contraseña es demasiado débil.';
    case 'auth/too-many-requests':
      return 'Demasiados intentos. Intenta más tarde.';
    default:
      return 'Ocurrió un error. Inténtalo de nuevo.';
  }
}
