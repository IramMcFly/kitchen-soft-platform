'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, Loader2, ArrowLeft, CheckCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getErrorMessage = (value: unknown) => {
    if (value instanceof Error && value.message) {
      return value.message;
    }

    return 'No se pudo procesar la solicitud. Intenta nuevamente.';
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/v1/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.message || 'No se pudo procesar la solicitud');
      }

      setSuccess('Si el correo existe, enviamos un enlace para restablecer tu contrasena.');
    } catch (requestError: unknown) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/" className="flex justify-center mb-6">
          <Image
            src="/logo.png"
            alt="Kitchen Soft"
            width={64}
            height={64}
            className="h-16 w-auto"
          />
        </Link>
        <h1 className="text-center text-3xl font-extrabold text-gray-900">Recuperar contrasena</h1>
        <p className="mt-2 text-center text-sm text-gray-600">
          Te enviaremos un enlace para crear una nueva contrasena.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Correo electronico
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="focus:ring-orange-500 focus:border-orange-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 text-gray-900"
                  placeholder="admin@restaurante.com"
                />
              </div>
            </div>

            {success && (
              <div className="rounded-md bg-green-50 p-4 border border-green-200">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <p className="text-sm text-green-800">{success}</p>
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-md bg-red-50 p-4 border border-red-200">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                  Enviando...
                </>
              ) : (
                'Enviar enlace de recuperacion'
              )}
            </button>
          </form>

          <div className="mt-6 border-t border-gray-100 pt-4">
            <Link
              href="/auth/login"
              className="inline-flex items-center text-sm text-gray-600 hover:text-orange-600 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a iniciar sesion
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
