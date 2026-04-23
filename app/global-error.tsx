'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global app error:', error);
  }, [error]);

  return (
    <html lang="es">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col items-center justify-center px-6 text-center">
          <h1 className="text-2xl font-semibold">Ocurrio un error inesperado</h1>
          <p className="mt-3 text-sm text-gray-600">
            La aplicacion encontro un problema. Puedes intentar nuevamente.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            className="mt-6 rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"
          >
            Reintentar
          </button>
        </main>
      </body>
    </html>
  );
}
