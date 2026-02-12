'use client';

import { Check, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const tiers = [
    {
        name: 'Plan Free',
        id: 'FREE',
        href: '/auth/register',
        priceMonthly: 'Gratis',
        description: 'Perfecto para pequeños negocios que están comenzando.',
        features: [
            '1 Sucursal',
            'Almacenamiento 100% local',
            'Máximo 1 Administrador',
            'Máximo 4 Mesas',
            'Máximo 1 Caja',
            'Máximo 1 Cajero',
            'Máximo 1 Cocinero',
            'Máximo 2 Meseros',
        ],
    },
    {
        name: 'Plan Mini',
        id: 'MINI',
        href: '/auth/register?plan=MINI',
        priceMonthly: '$100 MXN',
        description: 'Para negocios en crecimiento que necesitan más capacidad.',
        features: [
            '1 Sucursal',
            'Almacenamiento 100% local',
            'Máximo 2 Administradores',
            'Máximo 8 Mesas',
            'Máximo 1 Caja',
            'Máximo 2 Cajeros',
            'Máximo 2 Cocineros',
            'Máximo 2 Meseros',
        ],
    },
    {
        name: 'Plan Medium',
        id: 'MEDIUM',
        href: '/auth/register?plan=MEDIUM',
        priceMonthly: '$300 MXN',
        description: 'La solución ideal para restaurantes establecidos.',
        features: [
            '1 Sucursal',
            'Almacenamiento 100% local',
            'Máximo 4 Administradores',
            'Máximo 20 Mesas',
            'Máximo 2 Cajas simultáneas',
            'Máximo 4 Cajeros',
            'Máximo 8 Cocineros',
            'Máximo 12 Meseros',
        ],
    },
];

export default function Pricing() {
    const { data: session } = useSession();
    const router = useRouter();
    const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

    const handleSubscription = async (planId: string) => {
        if (!session) {
            router.push(`/auth/register?plan=${planId}`);
            return;
        }

        const isCurrentPlan = session.user?.plan === planId || (!session.user?.plan && planId === 'FREE');
        if (isCurrentPlan) {
            return; // Already on this plan
        }

        try {
            setLoadingPlan(planId);
            const response = await fetch('/api/stripe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    plan: planId,
                }),
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();
            window.location.href = data.url;
        } catch (error) {
            console.error('Error creating checkout session:', error);
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
                    Elige el plan que mejor se adapte a las necesidades de tu restaurante. Todos los planes incluyen almacenamiento local seguro.
                </p>
                <div className="isolate mx-auto mt-16 grid max-w-md grid-cols-1 gap-8 lg:mx-0 lg:max-w-none lg:grid-cols-3">
                    {tiers.map((tier) => {
                        // Check if this is the user's current plan
                        const isCurrentPlan = session?.user?.plan === tier.id || (!session?.user?.plan && tier.id === 'FREE');

                        // User is logged in but this is NOT their plan (so it's an upgrade/downgrade option)
                        const isUpgradeOption = session && !isCurrentPlan;

                        // Should the button be disabled?
                        // Disabled if: 
                        // 1. It IS the current plan
                        // 2. We are currently loading a checkout session for this plan
                        // 3. User is logged in, has the FREE plan, and checks the FREE card (redundant with #1 but explicit)
                        const isDisabled = !!(isCurrentPlan || loadingPlan === tier.id);

                        return (
                            <div
                                key={tier.name}
                                className={`rounded-3xl p-8 ring-1 ring-gray-200 xl:p-10 ${tier.name === 'Plan Mini' ? 'bg-white shadow-2xl ring-orange-600 scale-105' : 'bg-white ring-gray-200'
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
                                            : tier.name === 'Plan Mini' || isUpgradeOption
                                                ? 'bg-orange-600 text-white shadow-sm hover:bg-orange-500 focus-visible:outline-orange-600'
                                                : 'bg-orange-50 text-orange-600 hover:bg-orange-100'
                                        }`}
                                >
                                    {loadingPlan === tier.id ? (
                                        <Loader2 className="animate-spin h-5 w-5" />
                                    ) : isCurrentPlan ? (
                                        'Tu Plan Actual'
                                    ) : session ? (
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
            </div>
        </div>
    );
}
