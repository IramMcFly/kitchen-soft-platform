'use client';

import Navbar from '../components/Navbar';
import { useState, useEffect } from 'react';
import { Download, Building2, User, Save, Loader2, CheckCircle, AlertCircle, Database, Smartphone, Activity } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../components/AuthProvider';

type SystemOverview = {
    currentPlan: string;
    cloudSyncEnabled: boolean;
    devicesCount: number;
    totalSyncedRows: number;
    lastSyncAt: string | null;
    rowsByTable: Record<string, number>;
};

export default function Dashboard() {
    const { user, status, refresh } = useAuth();
    const router = useRouter();

    const [formData, setFormData] = useState({
        name: '',
        restaurantName: '',
    });
    const [devices, setDevices] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [userProfile, setUserProfile] = useState<any>(null);
    const [systemOverview, setSystemOverview] = useState<SystemOverview | null>(null);
    const [loadingSystemOverview, setLoadingSystemOverview] = useState(false);
    const currentPlan = userProfile?.plan || user?.plan || 'FREE';

    async function fetchProfile() {
        try {
            const res = await fetch('/api/profile');
            if (res.ok) {
                const data = await res.json();
                setUserProfile(data.user);
                setFormData({
                    name: data.user.name || '',
                    restaurantName: data.user.restaurantName || '',
                });
            }
        } catch (error) {
            console.error('Error fetching profile', error);
        }
    }

    async function fetchDevices() {
        try {
            const res = await fetch('/api/devices');
            if (res.ok) {
                const data = await res.json();
                setDevices(data.devices);
            }
        } catch (error) {
            console.error('Error fetching devices', error);
        }
    }

    async function fetchSystemOverview() {
        if (currentPlan !== 'PRO') {
            setSystemOverview(null);
            return;
        }

        setLoadingSystemOverview(true);
        try {
            const res = await fetch('/api/reports/stats', { cache: 'no-store' });
            if (res.ok) {
                const data = await res.json();
                setSystemOverview(data.system || null);
            }
        } catch (error) {
            console.error('Error fetching system overview', error);
        } finally {
            setLoadingSystemOverview(false);
        }
    }

    // Initialize profile/devices and handle auth redirect.
    useEffect(() => {
        if (status === 'unauthenticated') {
            router.replace('/auth/login');
            return;
        }

        if (status !== 'authenticated' || !user) {
            return;
        }

        void fetchProfile();
        void fetchDevices();

        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('success') === 'true') {
            void refresh().then(() => {
                router.replace('/dashboard');
                setMessage({ type: 'success', text: 'Plan actualizado correctamente!' });
            });
        }
    }, [refresh, router, status, user]);

    useEffect(() => {
        if (status !== 'authenticated') {
            return;
        }

        if (currentPlan !== 'PRO') {
            setSystemOverview(null);
            return;
        }

        void fetchSystemOverview();
    }, [currentPlan, status]);

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

    const handlePortal = async () => {
        try {
            setIsLoading(true);
            const res = await fetch('/api/stripe/portal', {
                method: 'POST',
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Error al crear sesión de portal');
            }

            if (data.url) {
                window.location.href = data.url;
            } else {
                throw new Error('No se recibió URL de redirección');
            }
        } catch (error) {
            console.error(error);
            setMessage({ type: 'error', text: 'Error al redirigir al portal de pagos' });
            setIsLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const formatDateTime = (value?: string | null) => {
        if (!value) {
            return 'Sin actividad reciente';
        }

        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            return 'Sin actividad reciente';
        }

        return date.toLocaleString();
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

            await refresh();

            setMessage({ type: 'success', text: 'Perfil actualizado correctamente' });

            // Clear success message after 3 seconds
            setTimeout(() => setMessage(null), 3000);

        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    if (status === 'loading') {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
            </div>
        );
    }

    if (status === 'unauthenticated') {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">
                        {user?.restaurantName ? `Dashboard de ${user.restaurantName}` : 'Tu Dashboard'}
                    </h1>
                    <p className="mt-2 text-gray-600">
                        Gestiona tu cuenta, dispositivos y plan de nube.
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
                                        Estás suscrito al plan <span className="font-bold text-lg uppercase">{currentPlan}</span>
                                    </p>
                                    <p className="text-sm text-gray-600 mt-1">
                                        {currentPlan === 'PRO'
                                            ? 'Tu cuenta tiene sincronización cloud completa y respaldos automáticos al cierre de caja.'
                                            : 'Actualmente operas en modo local. Cambia a PRO para habilitar nube multi-tenant.'}
                                    </p>
                                </div>
                                {currentPlan !== 'FREE' ? (
                                    <button
                                        onClick={handlePortal}
                                        disabled={isLoading}
                                        className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 shadow-sm transition-colors"
                                    >
                                        Gestionar Suscripción
                                    </button>
                                ) : (
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
                                        Ilimitadas
                                    </p>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <p className="text-xs text-gray-500 uppercase font-bold">Usuarios</p>
                                    <p className="text-lg font-semibold text-gray-900">
                                        Ilimitados
                                    </p>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <p className="text-xs text-gray-500 uppercase font-bold">Respaldo Cloud</p>
                                    <p className="text-lg font-semibold text-gray-900">
                                        {currentPlan === 'PRO' ? 'Habilitado' : 'Deshabilitado'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {currentPlan === 'PRO' && (
                        <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-100 lg:col-span-2">
                            <div className="px-4 py-5 sm:p-6">
                                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-2">
                                    Información Completa del Sistema
                                </h3>
                                <p className="text-sm text-gray-500 mb-6">
                                    Vista operativa de tu estado en nube para monitoreo administrativo en tiempo real.
                                </p>

                                {loadingSystemOverview ? (
                                    <div className="py-6 flex items-center justify-center text-gray-500">
                                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                        Cargando información del sistema...
                                    </div>
                                ) : !systemOverview ? (
                                    <div className="bg-amber-50 border border-amber-200 rounded-md p-4 text-sm text-amber-800">
                                        No se pudo cargar el resumen del sistema. Intenta recargar la página.
                                    </div>
                                ) : (
                                    <>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                            <div className="rounded-lg border border-gray-200 p-4 bg-gray-50">
                                                <div className="flex items-center gap-2 text-xs uppercase font-bold text-gray-500">
                                                    <Database className="h-4 w-4" />
                                                    Registros Sincronizados
                                                </div>
                                                <p className="mt-2 text-2xl font-semibold text-gray-900">
                                                    {systemOverview.totalSyncedRows.toLocaleString()}
                                                </p>
                                            </div>
                                            <div className="rounded-lg border border-gray-200 p-4 bg-gray-50">
                                                <div className="flex items-center gap-2 text-xs uppercase font-bold text-gray-500">
                                                    <Smartphone className="h-4 w-4" />
                                                    Dispositivos Vinculados
                                                </div>
                                                <p className="mt-2 text-2xl font-semibold text-gray-900">
                                                    {Number(systemOverview.devicesCount || 0)}
                                                </p>
                                            </div>
                                            <div className="rounded-lg border border-gray-200 p-4 bg-gray-50">
                                                <div className="flex items-center gap-2 text-xs uppercase font-bold text-gray-500">
                                                    <Activity className="h-4 w-4" />
                                                    Última Sincronización
                                                </div>
                                                <p className="mt-2 text-sm font-semibold text-gray-900">
                                                    {formatDateTime(systemOverview.lastSyncAt)}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="rounded-lg border border-gray-200 overflow-hidden">
                                            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 text-sm font-semibold text-gray-700">
                                                Desglose por módulos
                                            </div>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-gray-200">
                                                {Object.entries(systemOverview.rowsByTable || {}).map(([tableName, value]) => (
                                                    <div key={tableName} className="bg-white px-4 py-3">
                                                        <p className="text-xs uppercase text-gray-500 font-medium">{tableName}</p>
                                                        <p className="text-lg font-semibold text-gray-900">{Number(value || 0).toLocaleString()}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Device Management Section */}
                    <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-100 lg:col-span-2">
                        <div className="px-4 py-5 sm:p-6">
                            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                                Dispositivos Vinculados
                            </h3>
                            <p className="text-sm text-gray-500 mb-6">
                                Tu plan {currentPlan} permite conectar {currentPlan === 'FREE' ? '1 dispositivo' : 'múltiples dispositivos'}.
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
                                            value={user?.email || ''}
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
