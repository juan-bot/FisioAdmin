import { useState, FormEvent } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ThemeToggle } from '../ui/ThemeToggle';

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
      setError(translateError(err?.code));
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = "w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 dark:bg-gradient-to-br dark:from-[#0d130e] dark:to-[#16221a]">
      <div className="w-full max-w-md">
        <div className="flex justify-end mb-2">
          <ThemeToggle />
        </div>
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary text-white text-2xl font-bold mb-3 dark:shadow-lg dark:shadow-[#a7c874]/40">
            F
          </div>
        </div>
        <h1 className="text-2xl font-bold text-primary-dark dark:text-[#c2e08a]">FisioAdmin</h1>
        <p className="text-sm text-gray-500 mt-1 dark:text-[#8a9a88]">
          {mode === 'login' ? 'Inicia sesión para continuar' : 'Crea tu cuenta'}
        </p>

      <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-sm space-y-5 dark:bg-[#16221a] dark:border-[#2c4730] dark:shadow-2xl dark:shadow-black/60">
          {error && <div className="p-3 bg-danger-light border border-danger text-danger rounded-lg text-sm">{error}</div>}
          {authError && <div className="p-3 bg-danger-light border border-danger text-danger rounded-lg text-sm">{authError}</div>}
          {info && <div className="p-3 bg-secondary-light border border-secondary text-secondary-dark rounded-lg text-sm">{info}</div>}

          {mode === 'register' && (
            <div>
              <label className={labelClass}>Nombre completo</label>
              <input className={inputClass} value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Tu nombre" />
            </div>
          )}

          <div>
            <label className={labelClass}>Correo electrónico</label>
            <input type="email" className={inputClass} value={email} onChange={e => setEmail(e.target.value)} placeholder="correo@ejemplo.com" />
          </div>

          <div>
            <label className={labelClass}>Contraseña</label>
            <input type="password" className={inputClass} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-primary hover:bg-primary-hover text-white font-medium rounded-lg transition-colors disabled:opacity-60"
          >
            {submitting ? 'Procesando...' : mode === 'login' ? 'Iniciar sesión' : 'Registrarse'}
          </button>
        </form>

        <div className="text-center mt-5 text-sm text-gray-600">
          {mode === 'login' ? (
            <p>¿No tienes cuenta?{' '}
              <button className="text-primary font-medium hover:underline" onClick={() => { setMode('register'); setError(''); setInfo(''); }}>
                Regístrate
              </button>
            </p>
          ) : (
            <p>¿Ya tienes cuenta?{' '}
              <button className="text-primary font-medium hover:underline" onClick={() => { setMode('login'); setError(''); setInfo(''); }}>
                Inicia sesión
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
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
