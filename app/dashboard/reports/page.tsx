'use client';

import { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import { BarChart3, DollarSign, ShoppingBag, Users, UtensilsCrossed } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../components/AuthProvider';

export default function ReportsPage() {
    const { status } = useAuth();
    const router = useRouter();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.replace('/auth/login');
            return;
        }

        if (status !== 'authenticated') {
            return;
        }

        const fetchStats = async () => {
            try {
                const res = await fetch('/api/reports/stats');
                if (res.ok) {
                    const data = await res.json();
                    setStats(data.stats);
                }
            } catch (error) {
                console.error('Error fetching stats', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [router, status]);

    if (status === 'loading') {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <p className="text-sm text-gray-600">Cargando sesion...</p>
            </div>
        );
    }

    if (status === 'unauthenticated') {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
                <p className="text-sm text-gray-600">Sesion expirada. Redirigiendo a inicio de sesion...</p>
            </div>
        );
    }

    const StatCard = ({ title, value, icon: Icon, color }: any) => (
        <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-100">
            <div className="p-5">
                <div className="flex items-center">
                    <div className={`flex-shrink-0 rounded-md p-3 ${color}`}>
                        <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                        <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
                            <dd className="text-lg font-bold text-gray-900">
                                {loading ? '...' : value}
                            </dd>
                        </dl>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Reportes y Estadísticas</h1>
                    <p className="mt-2 text-gray-600">
                        Visualiza el rendimiento de tu restaurante en tiempo real desde la nube.
                    </p>
                </header>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        title="Ventas Totales"
                        value={`$${stats?.totalSales?.toFixed(2) || '0.00'}`}
                        icon={DollarSign}
                        color="bg-green-500"
                    />
                    <StatCard
                        title="Órdenes Registradas"
                        value={stats?.orders || 0}
                        icon={ShoppingBag}
                        color="bg-blue-500"
                    />
                    <StatCard
                        title="Productos en Menú"
                        value={stats?.products || 0}
                        icon={UtensilsCrossed}
                        color="bg-orange-500"
                    />
                    <StatCard
                        title="Cierres de Caja"
                        value={stats?.sessions || 0}
                        icon={BarChart3}
                        color="bg-purple-500"
                    />
                </div>

                {/* Placeholder for future charts */}
                <div className="mt-8 bg-white shadow rounded-lg p-6 border border-gray-100 text-center py-20">
                    <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">Gráficos Detallados</h3>
                    <p className="text-gray-500 mt-2">
                        Próximamente podrás ver gráficos de ventas por día, productos más vendidos y rendimiento de meseros.
                    </p>
                </div>
            </div>
        </div>
    );
}
