import { Smartphone, CreditCard, Database, Save, Server } from 'lucide-react';

const features = [
    {
        name: 'Control de Comandas',
        description: 'Toma de pedidos ágil. Los meseros pueden conectar sus dispositivos mediante código QR generado en Caja para tomar órdenes directamente desde la mesa.',
        icon: Smartphone,
    },
    {
        name: 'Caja y Arqueos',
        description: 'Apertura y cierre de caja detallado (efectivo, tarjeta, gastos). Cuadra tus cuentas al centavo.',
        icon: CreditCard,
    },
    {
        name: 'Base de Datos Local',
        description: 'Toda tu información vive en tu computadora. Sin dependencias de internet ni servidores externos.',
        icon: Database,
    },
    {
        name: 'Respaldos Inteligentes',
        description: 'Respaldos automáticos al cerrar caja. Exportación manual y herramienta de restauración integrada.',
        icon: Save,
    },
];

export default function Features() {
    return (
        <div className="py-16 bg-zinc-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                    <h2 className="text-base text-orange-600 font-semibold tracking-wide uppercase">Funcionalidades</h2>
                    <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                        Todo lo que necesitas para operar
                    </p>
                    <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
                        Diseñado pensando en la agilidad y el control.
                    </p>
                </div>

                <div className="mt-12">
                    <dl className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10">
                        {features.map((feature) => (
                            <div key={feature.name} className="relative">
                                <dt>
                                    <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-orange-500 text-white">
                                        <feature.icon className="h-6 w-6" aria-hidden="true" />
                                    </div>
                                    <p className="ml-16 text-lg leading-6 font-medium text-gray-900">{feature.name}</p>
                                </dt>
                                <dd className="mt-2 ml-16 text-base text-gray-500">{feature.description}</dd>
                            </div>
                        ))}
                    </dl>
                </div>
            </div>
        </div>
    );
}
