'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Menu, User as UserIcon, LogOut, Loader2 } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const { data: session, status } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="bg-white sticky top-0 z-50 shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex-shrink-0 flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3">
              <Image
                className="h-10 w-auto"
                src="/logo.png"
                alt="Kitchen Soft"
                width={40}
                height={40}
              />
              <span className="font-bold text-xl text-gray-900">Kitchen Soft POS</span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            {status === 'loading' ? (
              <div className="h-8 w-20 bg-gray-100 animate-pulse rounded"></div>
            ) : session ? (
              <div className="relative">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center gap-2 text-gray-700 hover:text-orange-600 font-medium focus:outline-none"
                >
                  <Link href="/dashboard" className="hidden md:block text-gray-700 hover:text-orange-600 font-medium mr-4">Dashboard</Link>
                  <Link href="/dashboard/reports" className="hidden md:block text-gray-700 hover:text-orange-600 font-medium mr-4">Reportes</Link>
                  <span className="hidden sm:inline">Hola, {session.user?.name?.split(' ')[0]}</span>
                  <div className="h-8 w-8 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center">
                    <UserIcon className="h-5 w-5" />
                  </div>
                </button>
                {/* Dropdown */}
                {isMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setIsMenuOpen(false)}
                    ></div>
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 border border-gray-100 z-20">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">{session.user?.name}</p>
                        <p className="text-xs text-gray-500 truncate">{session.user?.email}</p>
                        <p className="text-xs text-orange-600 font-bold mt-1">PLAN {session.user?.plan || 'FREE'}</p>
                      </div>
                      <button
                        onClick={() => signOut()}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                      >
                        <LogOut className="h-4 w-4" />
                        Cerrar Sesión
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="text-gray-600 hover:text-orange-600 font-medium transition-colors hidden sm:block"
                >
                  Iniciar Sesión
                </Link>
                <Link
                  href="/auth/register"
                  className="bg-orange-600 text-white px-4 py-2 rounded-md font-medium hover:bg-orange-700 transition-colors shadow-sm"
                >
                  Registrarse
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
