'use client';

import Link from 'next/link';
import { Download, BookOpen, AlertTriangle, LayoutDashboard } from 'lucide-react'; // Added LayoutDashboard
import { useSession } from 'next-auth/react';

export default function Hero() {
    const { data: session } = useSession();

    return (
        <div className="relative bg-white overflow-hidden">
            <div className="max-w-7xl mx-auto">
                <div className="relative z-10 pb-8 bg-white sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
                    {/* Background shape */}
                    <svg
                        className="hidden lg:block absolute right-0 inset-y-0 h-full w-48 text-white transform translate-x-1/2"
                        fill="currentColor"
                        viewBox="0 0 100 100"
                        preserveAspectRatio="none"
                        aria-hidden="true"
                    >
                        <polygon points="50,0 100,0 50,100 0,100" />
                    </svg>

                    <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
                        <div className="sm:text-center lg:text-left">
                            <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                                <span className="block xl:inline">Control total para</span>{' '}
                                <span className="block text-orange-600 xl:inline">tu restaurante</span>
                            </h1>
                            <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                                Un sistema POS moderno, rápido y 100% local. Gestiona mesas, comandas, cocina y cierres de
                                caja sin depender de internet.
                            </p>
                            <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start gap-3">
                                <div className="rounded-md shadow">
                                    {session ? (
                                        <Link
                                            href="/dashboard"
                                            className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 md:py-4 md:text-lg transition-all transform hover:scale-105"
                                        >
                                            <LayoutDashboard className="w-5 h-5 mr-2" />
                                            Ir al Dashboard
                                        </Link>
                                    ) : (
                                        <Link
                                            href="/auth/register"
                                            className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 md:py-4 md:text-lg transition-all transform hover:scale-105"
                                        >
                                            Comenzar Ahora
                                        </Link>
                                    )}
                                </div>
                            </div>

                            {!session && (
                                <div className="mt-6 text-sm text-gray-500 bg-orange-50 p-4 rounded-lg border border-orange-100 max-w-lg lg:mr-auto sm:mx-auto lg:mx-0">
                                    <div className="flex items-center gap-2 font-medium text-orange-800 mb-1">
                                        <AlertTriangle className="h-5 w-5" />
                                        <p>Importante:</p>
                                    </div>
                                    <p>
                                        Al registrarte obtendrás acceso inmediato al plan <strong>FREE</strong>.
                                        Podrás descargar el software y comenzar a operar tu negocio en minutos.
                                    </p>
                                </div>
                            )}
                        </div>
                    </main>
                </div>
            </div>
            <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2 bg-orange-50 flex items-center justify-center">
                <div className="p-10 grid grid-cols-2 gap-8 opacity-20">
                    <div className="text-orange-900 w-32 h-32 border-4 border-current rounded-full flex items-center justify-center">
                        POS
                    </div>
                    <div className="text-orange-900 w-32 h-32 border-4 border-current rounded-lg flex items-center justify-center">
                        KITCHEN
                    </div>
                    <div className="text-orange-900 w-32 h-32 border-4 border-current rounded-lg flex items-center justify-center">
                        ADMIN
                    </div>
                    <div className="text-orange-900 w-32 h-32 border-4 border-current rounded-full flex items-center justify-center">
                        WAITER
                    </div>
                </div>
            </div>
        </div>
    );
}
