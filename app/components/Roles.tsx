import { ShieldCheck, Banknote, User, Utensils } from 'lucide-react';

const roles = [
    {
        name: 'Administrador',
        description: 'Control total. Gestión de usuarios, configuración del restaurante, menú y reportes financieros.',
        icon: ShieldCheck,
    },
    {
        name: 'Caja',
        description: 'Cobro de cuentas, arqueos de caja y generación de códigos QR para conectar dispositivos móviles a la red local.',
        icon: Banknote,
    },
    {
        name: 'Mesero',
        description: 'Interfaz móvil optimizada. Toma pedidos escaneando el QR de la caja, sin necesidad de instalar apps adicionales.',
        icon: User,
    },
    {
        name: 'Cocina',
        description: 'Pantalla de comandas en tiempo real. Organiza la preparación de alimentos y notifica cuando los platillos están listos.',
        icon: Utensils,
    },
];

export default function Roles() {
    return (
        <div className="py-16 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="lg:text-center">
                    <h2 className="text-base text-orange-600 font-semibold tracking-wide uppercase">Roles del Sistema</h2>
                    <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                        Cada quien a lo suyo
                    </p>
                    <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
                        Perfiles especializados para optimizar cada área de tu restaurante.
                    </p>
                </div>

                <div className="mt-12">
                    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
                        {roles.map((role) => (
                            <div key={role.name} className="pt-6">
                                <div className="flow-root bg-gray-50 rounded-lg px-6 pb-8 h-full hover:shadow-md transition-shadow">
                                    <div className="-mt-6">
                                        <div>
                                            <span className="inline-flex items-center justify-center p-3 bg-orange-500 rounded-md shadow-lg">
                                                <role.icon className="h-6 w-6 text-white" aria-hidden="true" />
                                            </span>
                                        </div>
                                        <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">{role.name}</h3>
                                        <p className="mt-5 text-base text-gray-500">
                                            {role.description}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
