'use client';

import { useSession } from 'next-auth/react';
import Navbar from '../components/Navbar';
import { ShieldAlert, Search, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function AdminDashboard() {
    const { data: session } = useSession();
    const [users, setUsers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    useEffect(() => {
        fetchUsers();
    }, [searchTerm]);

    // Debounce search could be added here, but simple effect is fine for now
    const fetchUsers = async () => {
        try {
            const query = searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : '';
            const res = await fetch(`/api/admin/users${query}`);
            if (res.ok) {
                const data = await res.json();
                setUsers(data.users);
            }
        } catch (error) {
            console.error('Error fetching users', error);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleStatus = async (userId: string, currentStatus: boolean) => {
        setUpdatingId(userId);
        try {
            const res = await fetch(`/api/admin/users/${userId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: !currentStatus }),
            });

            if (res.ok) {
                // Optimistic update
                setUsers(users.map(u => u._id === userId ? { ...u, isActive: !currentStatus } : u));
            }
        } catch (error) {
            console.error('Error toggling status', error);
            alert('Error al actualizar el estado');
        } finally {
            setUpdatingId(null);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
                <header className="mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3 mb-4 sm:mb-0">
                            <ShieldAlert className="h-8 w-8 text-red-600" />
                            <div>
                                <h1 className="text-3xl font-bold leading-tight text-gray-900">
                                    Panel de Administración
                                </h1>
                                <p className="mt-1 text-sm text-gray-600">
                                    Gestión de usuarios y licencias.
                                </p>
                            </div>
                        </div>

                        {/* Search Bar */}
                        <div className="relative rounded-md shadow-sm max-w-xs w-full">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                className="focus:ring-red-500 focus:border-red-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2"
                                placeholder="Buscar usuario..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </header>

                <main>
                    <div className="bg-white shadow overflow-hidden sm:rounded-lg border border-gray-200">
                        {isLoading ? (
                            <div className="p-8 flex justify-center">
                                <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
                            </div>
                        ) : users.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                No se encontraron usuarios.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Usuario / Restaurante
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Plan / Dispositivos
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Estado
                                            </th>
                                            <th scope="col" className="relative px-6 py-3">
                                                <span className="sr-only">Acciones</span>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {users.map((user) => (
                                            <tr key={user._id} className={user.isActive ? '' : 'bg-gray-50 opacity-75'}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                                            <div className="text-sm text-gray-500">{user.email}</div>
                                                            <div className="text-xs text-orange-600 font-medium">{user.restaurantName}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">{user.plan}</div>
                                                    <div className="text-xs text-gray-500">{user.devices?.length || 0} dispositivos</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                        {user.isActive ? 'Activo' : 'Suspendido'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <button
                                                        onClick={() => toggleStatus(user._id, user.isActive)}
                                                        disabled={updatingId === user._id || user.role === 'ADMIN'}
                                                        className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${user.isActive ? 'bg-green-600' : 'bg-gray-200'
                                                            } ${user.role === 'ADMIN' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                    >
                                                        <span className="sr-only">Toggle Status</span>
                                                        <span
                                                            aria-hidden="true"
                                                            className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${user.isActive ? 'translate-x-5' : 'translate-x-0'
                                                                }`}
                                                        />
                                                    </button>
                                                    {updatingId === user._id && (
                                                        <span className="ml-2 inline-block">
                                                            <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
