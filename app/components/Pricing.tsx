'use client';

import { Check, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useAuth } from './AuthProvider';

const PRO_MONTHLY_PRICE_USD = 25;

const proBenefits = [
    'Respaldo en la nube al cierre de caja, sin afectar la operación local.',
    'Sincronización segura entre dispositivos con aislamiento por cuenta.',
    'Monitoreo del estado del sistema: filas sincronizadas, última sincronización y dispositivos vinculados.',
    'Portal de suscripción para autogestionar pagos y cambios de plan.',
];

const tiers = [
    {
        name: 'Plan Free',
        id: 'FREE',
        href: '/auth/register',
        priceMonthly: 'Gratis',
        description: 'Operación 100% local, ideal para comenzar sin costo.',
        features: [
            '1 Sucursal',
            'Almacenamiento 100% local',
            'Operación local ilimitada',
            'Sin respaldos en la nube',
            'Sincronización cloud deshabilitada',
        ],
    },
    {
        name: 'Plan PRO',
        id: 'PRO',
        href: '/auth/register?plan=PRO',
        priceMonthly: `$${PRO_MONTHLY_PRICE_USD} USD`,
        description: 'Pensado para operar localmente y proteger tu negocio con respaldo y sincronización en la nube.',
        features: [
            '1 Sucursal',
            'Almacenamiento 100% local',
            'Operación local ilimitada',
            'Respaldos automáticos al cierre de caja',
            'Sincronización multi-dispositivo por cuenta',
            'Panel con insights del sistema en tiempo real',
            'Aislamiento de datos por usuario (multi-tenant)',
            'Gestión de suscripción desde portal de cliente',
        ],
    },
];

export default function Pricing() {
    const { user, isAuthenticated } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

    // Check for error param on mount
    useEffect(() => {
        const error = searchParams.get('error');
        if (error === 'subscription_sync_issue') {
            alert('⚠️ Tu suscripción ha sido reiniciada debido a un problema de sincronización con la plataforma de pagos. Por favor, selecciona tu plan nuevamente para reactivarla.');
            // Optional: Remove param from URL without refresh
            router.replace('/#pricing');
        }
    }, [searchParams, router]);

    const handleSubscription = async (planId: string) => {
        if (!isAuthenticated) {
            router.push(`/auth/register?plan=${planId}`);
            return;
        }

        const isCurrentPlan = user?.plan === planId || (!user?.plan && planId === 'FREE');
        if (isCurrentPlan) {
            return; // Already on this plan
        }

        try {
            setLoadingPlan(planId);

            // If user already has a paid plan, send them to the Portal to manage/switch plans
            // instead of creating a new checkout session.
            const hasPaidPlan = user?.plan && user.plan !== 'FREE';

            if (hasPaidPlan) {
                const response = await fetch('/api/stripe/portal', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                });

                if (!response.ok) throw new Error('Error al conectar con portal');

                const data = await response.json();
                window.location.href = data.url;
                return;
            }

            // Otherwise (FREE users), creates a new subscription checkout
            const response = await fetch('/api/stripe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    plan: planId,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Network response was not ok');
            }
            window.location.href = data.url;
        } catch (error) {
            console.error('Error processing request:', error);
            alert('Hubo un error al procesar tu solicitud. Por favor intenta de nuevo.');
        } finally {
            setLoadingPlan(null);
        }
    };

    return (
        <div id="pricing" className="bg-gray-50 py-12 sm:py-32 lg:py-40">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="mx-auto max-w-4xl text-center">
                    <h2 className="text-base font-semibold leading-7 text-orange-600">Precios</h2>
                    <p className="mt-2 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
                        Planes flexibles para cada etapa
                    </p>
                </div>
                <p className="mx-auto mt-6 max-w-2xl text-center text-lg leading-8 text-gray-600">
                    Elige entre FREE y PRO. Ambos operan localmente; PRO agrega respaldo en la nube, sincronización segura y monitoreo del sistema por $25 USD al mes.
                </p>
                <div className="isolate mx-auto mt-16 grid max-w-md grid-cols-1 gap-8 lg:mx-auto lg:max-w-4xl lg:grid-cols-2">
                    {tiers.map((tier) => {
                        // Check if this is the user's current plan
                        const isCurrentPlan = user?.plan === tier.id || (!user?.plan && tier.id === 'FREE');

                        // User is logged in but this is NOT their plan (so it's an upgrade/downgrade option)
                        const isUpgradeOption = isAuthenticated && !isCurrentPlan;

                        // Should the button be disabled?
                        // Disabled if: 
                        // 1. It IS the current plan
                        // 2. We are currently loading a checkout session for this plan
                        // 3. User is logged in, has the FREE plan, and checks the FREE card (redundant with #1 but explicit)
                        const isDisabled = !!(isCurrentPlan || loadingPlan === tier.id);

                        return (
                            <div
                                key={tier.name}
                                className={`rounded-3xl p-8 ring-1 ring-gray-200 xl:p-10 ${tier.id === 'PRO' ? 'bg-white shadow-2xl ring-orange-600 scale-105' : 'bg-white ring-gray-200'
                                    }`}
                            >
                                <h3
                                    id={tier.name}
                                    className="text-lg font-semibold leading-8 text-gray-900"
                                >
                                    {tier.name}
                                </h3>
                                <p className="mt-4 text-sm leading-6 text-gray-500">{tier.description}</p>
                                <p className="mt-6 flex items-baseline gap-x-1">
                                    <span className="text-4xl font-bold tracking-tight text-gray-900">{tier.priceMonthly}</span>
                                    {tier.priceMonthly !== 'Gratis' && <span className="text-sm font-semibold leading-6 text-gray-600">/mes</span>}
                                </p>

                                <button
                                    onClick={() => handleSubscription(tier.id)}
                                    disabled={isDisabled}
                                    aria-describedby={tier.name}
                                    className={`mt-6 w-full flex items-center justify-center rounded-md py-2 px-3 text-center text-sm font-semibold leading-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${isCurrentPlan
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : tier.id === 'PRO' || isUpgradeOption
                                            ? 'bg-orange-600 text-white shadow-sm hover:bg-orange-500 focus-visible:outline-orange-600'
                                            : 'bg-orange-50 text-orange-600 hover:bg-orange-100'
                                        }`}
                                >
                                    {loadingPlan === tier.id ? (
                                        <Loader2 className="animate-spin h-5 w-5" />
                                    ) : isCurrentPlan ? (
                                        'Tu Plan Actual'
                                    ) : isAuthenticated ? (
                                        'Actualizar Plan'
                                    ) : (
                                        'Elegir plan'
                                    )}
                                </button>

                                <ul role="list" className="mt-8 space-y-3 text-sm leading-6 text-gray-600">
                                    {tier.features.map((feature) => (
                                        <li key={feature} className="flex gap-x-3">
                                            <Check className="h-6 w-5 flex-none text-orange-600" aria-hidden="true" />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )
                    })}
                </div>

                <div className="mx-auto mt-10 max-w-4xl rounded-2xl border border-orange-200 bg-orange-50 p-6 sm:p-8">
                    <h3 className="text-lg font-semibold text-orange-900">Beneficios de activar PRO</h3>
                    <p className="mt-2 text-sm text-orange-800">
                        Con PRO mantienes tu operación local y sumas una capa de continuidad para proteger ventas, inventario y trazabilidad operativa.
                    </p>
                    <ul className="mt-5 grid grid-cols-1 gap-3 text-sm leading-6 text-orange-900 sm:grid-cols-2">
                        {proBenefits.map((benefit) => (
                            <li key={benefit} className="flex gap-x-2">
                                <Check className="h-5 w-5 flex-none text-orange-700" aria-hidden="true" />
                                <span>{benefit}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}
