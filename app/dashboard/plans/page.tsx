import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { ArrowRight, Plus, Calendar, Trophy } from 'lucide-react';
import { formatDate, getCategoryLabel, getGenderLabel } from '@/lib/utils';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function PlansPage() {
    const session = await auth();
    if (!session) redirect('/login');
    const role = (session.user as any)?.role || 'athlete';
    const isAdmin = ['admin', 'coach'].includes(role);

    // If athlete, only show their own plans (active or completed)
    const whereClause = isAdmin ? {} : {
        athlete: { userId: session?.user?.id },
        status: { in: ['active', 'completed'] }
    };

    const plans = await prisma.trainingPlan.findMany({
        where: whereClause,
        include: {
            athlete: { select: { fullName: true, category: true, gender: true } },
            coach: { select: { name: true } },
            mesocycles: { orderBy: { orderIndex: 'asc' } },
            _count: { select: { mesocycles: true } },
        },
        orderBy: { createdAt: 'desc' },
    });

    const phaseColors: Record<string, string> = {
        accumulation: 'phase-accumulation',
        transformation: 'phase-transformation',
        realization: 'phase-realization',
    };
    const phaseLabels: Record<string, string> = {
        accumulation: '📦 Acumulación',
        transformation: '⚡ Transformación',
        realization: '🏆 Realización',
    };
    const statusColor: Record<string, string> = {
        active: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
        draft: 'bg-gray-500/15 text-gray-300 border-gray-500/30',
        completed: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    };
    const statusLabel: Record<string, string> = { active: 'Activo', draft: 'Borrador', completed: 'Completado' };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">{isAdmin ? 'Planes ATR' : 'Mis Planes'}</h1>
                    <p className="text-gray-400 mt-1">{plans.length} plan{plans.length !== 1 ? 'es' : ''} de entrenamiento</p>
                </div>
                {isAdmin && (
                    <Link href="/dashboard/plans/new" className="btn-brand flex items-center gap-2">
                        <Plus size={16} />
                        Nuevo Plan
                    </Link>
                )}
            </div>

            {plans.length === 0 ? (
                <div className="glass rounded-2xl p-16 text-center">
                    <p className="text-5xl mb-4">📋</p>
                    <p className="text-gray-300 font-semibold text-lg">{isAdmin ? 'Sin planes de entrenamiento' : 'No tienes planes activos'}</p>
                    {isAdmin ? (
                        <Link href="/dashboard/plans/new" className="btn-brand inline-flex items-center gap-2 mt-6">
                            <Plus size={16} /> Crear primer plan ATR
                        </Link>
                    ) : (
                        <p className="text-gray-500 text-sm mt-2">Tu entrenador asignará un plan pronto.</p>
                    )}
                </div>
            ) : (
                <div className="space-y-3">
                    {plans.map((plan: any) => {
                        const daysLeft = plan.competitionDate
                            ? Math.max(0, Math.ceil((new Date(plan.competitionDate).getTime() - Date.now()) / 86400000))
                            : null;
                        const currentPhase = plan.mesocycles.find((m: any) =>
                            m.orderIndex === Math.min(...plan.mesocycles.map((x: any) => x.orderIndex))
                        );

                        return (
                            <Link
                                key={plan.id}
                                href={`/dashboard/plans/${plan.id}`}
                                className="glass rounded-2xl p-5 card-hover group flex flex-col md:flex-row md:items-center gap-5"
                            >
                                {/* Phase indicator */}
                                <div className="hidden md:block w-1.5 h-16 rounded-full flex-shrink-0"
                                    style={{ background: currentPhase?.atrPhase === 'realization' ? '#6ee7b7' : currentPhase?.atrPhase === 'transformation' ? '#fcd34d' : '#93c5fd' }} />

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-1">
                                        <h3 className="font-semibold text-white truncate">{plan.name}</h3>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-wider flex-shrink-0 ${statusColor[plan.status] || statusColor.draft}`}>
                                            {statusLabel[plan.status] || plan.status}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-400">
                                        {isAdmin ? `${plan.athlete.fullName} · ` : ''}{getCategoryLabel(plan.athlete.category)} {plan.athlete.gender === 'female' ? '♀' : '♂'} · Coach: {plan.coach.name}
                                    </p>
                                </div>

                                {/* Mesocycle pills */}
                                <div className="flex flex-wrap gap-2 flex-shrink-0">
                                    {plan.mesocycles.map((m: any) => (
                                        <span key={m.id} className={`text-xs px-2.5 py-1 rounded-full font-medium border border-white/5 ${phaseColors[m.atrPhase]}`}>
                                            {phaseLabels[m.atrPhase]}
                                        </span>
                                    ))}
                                </div>

                                <div className="flex justify-between md:flex-col items-center md:items-end gap-1 flex-shrink-0 mt-3 md:mt-0 w-full md:w-auto">
                                    {daysLeft !== null && (
                                        <div className="flex items-center gap-1 text-xs text-gray-400">
                                            <Trophy size={12} className="text-brand-400" />
                                            <span>{daysLeft} días a comp.</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-1 text-xs text-gray-500">
                                        <Calendar size={12} />
                                        <span>{formatDate(plan.startDate)}</span>
                                    </div>
                                </div>

                                <ArrowRight size={16} className="text-gray-600 group-hover:text-brand-400 transition-colors flex-shrink-0 hidden md:block" />
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
