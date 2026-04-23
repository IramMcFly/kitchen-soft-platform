'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Loader2, ShieldCheck, AlertCircle } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';

export default function ResetPasswordPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getErrorMessage = (value: unknown) => {
    if (value instanceof Error && value.message) {
      return value.message;
    }

    return 'No se pudo actualizar la contrasena.';
  };

  useEffect(() => {
    let ignore = false;

    const bootstrap = async () => {
      if (!supabase) {
        if (!ignore) {
          setError('Falta configuracion de Supabase para restablecer contrasena.');
          setInitializing(false);
        }
        return;
      }

      const { data } = await supabase.auth.getSession();

      if (!ignore) {
        setReady(Boolean(data.session));
        setInitializing(false);
      }

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event, session) => {
        if (ignore) {
          return;
        }

        if (event === 'PASSWORD_RECOVERY' || Boolean(session)) {
          setReady(true);
        }
      });

      return () => subscription.unsubscribe();
    };

    const cleanupPromise = bootstrap();

    return () => {
      ignore = true;
      if (cleanupPromise instanceof Promise) {
        cleanupPromise.then((cleanup) => {
          if (typeof cleanup === 'function') {
            cleanup();
          }
        });
      }
    };
  }, [supabase]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!supabase) {
      setError('Falta configuracion de Supabase para restablecer contrasena.');
      return;
    }

    if (password.length < 6) {
      setError('La contrasena debe tener al menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contrasenas no coinciden.');
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });

      if (updateError) {
        throw new Error(updateError.message || 'No se pudo actualizar la contrasena');
      }

      setMessage('Contrasena actualizada correctamente. Ya puedes iniciar sesion.');
      setPassword('');
      setConfirmPassword('');
    } catch (submitError: unknown) {
      setError(getErrorMessage(submitError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white shadow-sm p-6 sm:p-8">
        <h1 className="text-2xl font-bold text-gray-900">Crear nueva contrasena</h1>
        <p className="mt-2 text-sm text-gray-600">
          Usa una contrasena segura para proteger tu cuenta.
        </p>

        {initializing ? (
          <div className="mt-6 flex items-center gap-2 text-sm text-gray-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            Validando enlace...
          </div>
        ) : !ready ? (
          <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-2 text-amber-800">
              <AlertCircle className="h-5 w-5 mt-0.5" />
              <div>
                <p className="text-sm font-medium">El enlace no es valido o ya expiro.</p>
                <p className="text-xs mt-1">Solicita uno nuevo desde la pagina de recuperacion.</p>
              </div>
            </div>
            <Link href="/auth/forgot-password" className="mt-3 inline-block text-sm text-orange-700 hover:underline">
              Solicitar nuevo enlace
            </Link>
          </div>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Nueva contrasena
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-orange-500 focus:ring-orange-500"
              />
            </div>

            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
                Confirmar contrasena
              </label>
              <input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-orange-500 focus:ring-orange-500"
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            {message && (
              <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700 flex items-start gap-2">
                <ShieldCheck className="h-5 w-5 mt-0.5" />
                <span>{message}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Actualizando...' : 'Actualizar contrasena'}
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <Link href="/auth/login" className="text-sm text-gray-600 hover:text-orange-600">
            Volver a iniciar sesion
          </Link>
        </div>
      </div>
    </div>
  );
}
