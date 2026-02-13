'use client';

import { useSession } from 'next-auth/react';
import Navbar from '../components/Navbar';
import { useState, useEffect } from 'react';
import { Download, Building2, User, Save, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
    const { data: session, update } = useSession();
    const router = useRouter();

    const [formData, setFormData] = useState({
        name: '',
        restaurantName: '',
    });
    const [devices, setDevices] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [userProfile, setUserProfile] = useState<any>(null);

    // Initialize form and fetch devices
    useEffect(() => {
        if (session?.user) {
            fetchProfile();
            fetchDevices();
        }

        // Check for success param and refresh session if needed
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('success') === 'true') {
            // Force session update to get latest plan from DB
            // We pass a dummy object to trigger the 'update' event in the JWT callback
            update({ refresh: true }).then(() => {
                router.replace('/dashboard'); // Remove query param
                setMessage({ type: 'success', text: 'Plan actualizado correctamente!' });
            });
        }
    }, [session]);

    const fetchProfile = async () => {
        try {
            const res = await fetch('/api/profile');
            if (res.ok) {
                const data = await res.json();
                setUserProfile(data.user);
                setFormData({
                    name: data.user.name || '',
                    restaurantName: data.user.restaurantName || '',
                });

                // Sync session if plan differs
                if (session?.user?.plan !== data.user.plan) {
                    await update({
                        ...session,
                        user: {
                            ...session?.user,
                            plan: data.user.plan,
                            name: data.user.name,
                            restaurantName: data.user.restaurantName,
                            role: data.user.role
                        },
                    });
                }
            }
        } catch (error) {
            console.error('Error fetching profile', error);
        }
    };

    const fetchDevices = async () => {
        try {
            const res = await fetch('/api/devices');
            if (res.ok) {
                const data = await res.json();
                setDevices(data.devices);
            }
        } catch (error) {
            console.error('Error fetching devices', error);
        }
    };

    const handleUnlink = async (deviceId: string) => {
        if (!confirm('¿Estás seguro de que quieres desvincular este dispositivo?')) return;

        try {
            const res = await fetch('/api/devices', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ deviceId }),
            });

            if (res.ok) {
                setMessage({ type: 'success', text: 'Dispositivo desvinculado' });
                fetchDevices();
                setTimeout(() => setMessage(null), 3000);
            } else {
                throw new Error('Error al desvincular');
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'No se pudo desvincular el dispositivo' });
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage(null);

        try {
            const res = await fetch('/api/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Error al actualizar');
            }

            // Update NextAuth session client-side
            await update({
                ...session,
                user: {
                    ...session?.user,
                    name: formData.name,
                    restaurantName: formData.restaurantName,
                },
            });

            setMessage({ type: 'success', text: 'Perfil actualizado correctamente' });

            // Clear success message after 3 seconds
            setTimeout(() => setMessage(null), 3000);

        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">
                        {session?.user?.restaurantName ? `Dashboard de ${session.user.restaurantName}` : 'Tu Dashboard'}
                    </h1>
                    <p className="mt-2 text-gray-600">
                        Gestiona tu cuenta, dispositivos y licencia.
                    </p>
                </header>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Plan Management Section */}
                    <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-100 lg:col-span-2">
                        <div className="px-4 py-5 sm:p-6">
                            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                                Tu Plan Actual
                            </h3>
                            <div className="flex items-center justify-between bg-orange-50 p-4 rounded-lg border border-orange-100">
                                <div>
                                    <p className="text-sm font-medium text-orange-800">
                                        Estás suscrito al plan <span className="font-bold text-lg uppercase">{userProfile?.plan || session?.user?.plan || 'FREE'}</span>
                                    </p>
                                    <p className="text-sm text-gray-600 mt-1">
                                        {(userProfile?.plan || session?.user?.plan) === 'MEDIUM'
                                            ? 'Tienes acceso a todas las funcionalidades y límites máximos.'
                                            : 'Actualiza tu plan para obtener más mesas, usuarios y dispositivos.'}
                                    </p>
                                </div>
                                {(userProfile?.plan || session?.user?.plan) !== 'MEDIUM' && (
                                    <button
                                        onClick={() => router.push('/#pricing')}
                                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 shadow-sm transition-colors"
                                    >
                                        Mejorar Plan
                                    </button>
                                )}
                            </div>

                            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <p className="text-xs text-gray-500 uppercase font-bold">Mesas</p>
                                    <p className="text-lg font-semibold text-gray-900">
                                        {(userProfile?.plan || session?.user?.plan) === 'FREE' ? '4' : (userProfile?.plan || session?.user?.plan) === 'MINI' ? '8' : '20'} Max
                                    </p>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <p className="text-xs text-gray-500 uppercase font-bold">Usuarios</p>
                                    <p className="text-lg font-semibold text-gray-900">
                                        {(userProfile?.plan || session?.user?.plan) === 'FREE' ? '5' : (userProfile?.plan || session?.user?.plan) === 'MINI' ? '7' : '28'} Max
                                    </p>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <p className="text-xs text-gray-500 uppercase font-bold">Cajas</p>
                                    <p className="text-lg font-semibold text-gray-900">
                                        {(userProfile?.plan || session?.user?.plan) === 'MEDIUM' ? '2' : '1'} Max
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Device Management Section */}
                    <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-100 lg:col-span-2">
                        <div className="px-4 py-5 sm:p-6">
                            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                                Dispositivos Vinculados
                            </h3>
                            <p className="text-sm text-gray-500 mb-6">
                                Tu plan {userProfile?.plan || session?.user?.plan || 'FREE'} permite conectar {(userProfile?.plan || session?.user?.plan) === 'FREE' ? '1 dispositivo' : 'múltiples dispositivos'}.
                            </p>

                            {devices.length === 0 ? (
                                <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                                    <p className="text-gray-500">No hay dispositivos vinculados aún.</p>
                                    <p className="text-xs text-gray-400 mt-1">Inicia sesión desde la aplicación de escritorio para vincularlos.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {devices.map((device) => (
                                        <div key={device.deviceId} className="border rounded-lg p-4 flex flex-col justify-between bg-gray-50">
                                            <div>
                                                <div className="flex items-center space-x-3 mb-2">
                                                    <div className="bg-white p-2 rounded-full border">
                                                        <Download className="h-5 w-5 text-gray-600" />
                                                    </div>
                                                    <h4 className="font-medium text-gray-900">{device.name}</h4>
                                                </div>
                                                <p className="text-xs text-gray-500">
                                                    Último acceso: {new Date(device.lastLogin).toLocaleDateString()}
                                                </p>
                                                <p className="text-xs text-gray-400 font-mono mt-1 truncate" title={device.deviceId}>
                                                    ID: {device.deviceId}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => handleUnlink(device.deviceId)}
                                                className="mt-4 w-full text-center text-xs text-red-600 hover:text-red-800 border border-red-200 hover:bg-red-50 rounded py-1 transition-colors"
                                            >
                                                Desvincular
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Download Section */}
                    <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-100">
                        <div className="p-6">
                            <div className="flex items-center">
                                <div className="flex-shrink-0 bg-orange-100 rounded-md p-3">
                                    <Download className="h-8 w-8 text-orange-600" />
                                </div>
                                <div className="ml-4">
                                    <h2 className="text-lg font-medium text-gray-900">Descargar Kitchen Soft</h2>
                                    <p className="text-sm text-gray-500">Versión {process.env.NEXT_PUBLIC_LATEST_VERSION || '1.0.0'} para Windows</p>
                                </div>
                            </div>
                            <div className="mt-6">
                                <p className="text-gray-600 mb-6">
                                    Obtén la aplicación de escritorio para comenzar a gestionar tus comandas, inventarios y ventas sin depender de internet.
                                </p>
                                {process.env.NEXT_PUBLIC_DOWNLOAD_URL ? (
                                    <a
                                        href={process.env.NEXT_PUBLIC_DOWNLOAD_URL}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full flex justify-center items-center px-4 py-3 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 transition-colors"
                                    >
                                        <Download className="mr-2 h-5 w-5" />
                                        Descargar Instalador (.exe)
                                    </a>
                                ) : (
                                    <button
                                        onClick={() => alert('¡Próximamente! El enlace de descarga estará disponible aquí.')}
                                        className="w-full flex justify-center items-center px-4 py-3 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-900 hover:bg-gray-800 transition-colors"
                                    >
                                        <Download className="mr-2 h-5 w-5" />
                                        Descargar Instalador (.exe)
                                    </button>
                                )}
                                <p className="mt-4 text-xs text-center text-gray-400">
                                    Requiere Windows 10 o superior (64-bits)
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Profile Section */}
                    <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-100">
                        <div className="px-4 py-5 sm:p-6">
                            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                                Configuración de Perfil
                            </h3>

                            {message && (
                                <div className={`mb-4 p-4 rounded-md flex items-center ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                    {message.type === 'success' ? <CheckCircle className="h-5 w-5 mr-2" /> : <AlertCircle className="h-5 w-5 mr-2" />}
                                    {message.text}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                        Nombre Completo
                                    </label>
                                    <div className="mt-1 relative rounded-md shadow-sm">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <User className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            type="text"
                                            name="name"
                                            id="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            required
                                            className="focus:ring-orange-500 focus:border-orange-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 text-gray-900"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="restaurantName" className="block text-sm font-medium text-gray-700">
                                        Nombre del Restaurante
                                    </label>
                                    <div className="mt-1 relative rounded-md shadow-sm">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Building2 className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            type="text"
                                            name="restaurantName"
                                            id="restaurantName"
                                            value={formData.restaurantName}
                                            onChange={handleChange}
                                            required
                                            className="focus:ring-orange-500 focus:border-orange-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 text-gray-900"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Correo Electrónico
                                    </label>
                                    <div className="mt-1">
                                        <input
                                            type="text"
                                            disabled
                                            value={session?.user?.email || ''}
                                            className="bg-gray-50 block w-full sm:text-sm border-gray-300 rounded-md py-2 text-gray-500 cursor-not-allowed px-3"
                                        />
                                        <p className="mt-1 text-xs text-gray-400">El correo no se puede cambiar por seguridad.</p>
                                    </div>
                                </div>

                                <div className="pt-4">
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-70 transition-colors"
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                                                Guardando...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="-ml-1 mr-2 h-5 w-5" />
                                                Guardar Cambios
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
