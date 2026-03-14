import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getCategoryLabel, getGenderLabel, getDayLabel, formatDate } from '@/lib/utils';
import { ArrowLeft, Calendar, Target, Dumbbell, Edit2, Play, CheckCircle } from 'lucide-react';
import { auth } from '@/lib/auth';

const phaseInfo: Record<string, { label: string; emoji: string; cls: string }> = {
    accumulation: { label: 'Acumulación', emoji: '📦', cls: 'phase-accumulation bg-blue-500/10 text-blue-400 border border-blue-500/20' },
    transformation: { label: 'Transformación', emoji: '⚡', cls: 'phase-transformation bg-amber-500/10 text-amber-400 border border-amber-500/20' },
    realization: { label: 'Realización', emoji: '🏆', cls: 'phase-realization bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' },
};

export default async function PlanDetailPage({ params }: { params: { id: string } }) {
    const session = await auth();
    if (!session) redirect('/login');
    const role = (session.user as any)?.role || 'athlete';
    const isAdmin = ['admin', 'coach'].includes(role);

    const plan = await prisma.trainingPlan.findUnique({
        where: { id: params.id },
        include: {
            athlete: true,
            coach: { select: { name: true } },
            mesocycles: {
                orderBy: { orderIndex: 'asc' },
                include: {
                    sessions: {
                        orderBy: [{ weekNumber: 'asc' }, { dayOfWeek: 'asc' }],
                        include: { exercises: { orderBy: { orderIndex: 'asc' }, include: { exercise: true } } },
                    },
                },
            },
        },
    });

    if (!plan) return notFound();

    // Security check: if athlete, they can only view their own plan
    if (!isAdmin && plan.athlete.userId !== session?.user?.id) {
        redirect('/dashboard/plans');
    }

    const athlete = plan.athlete;
    const oneRm = (() => { try { return JSON.parse(athlete.oneRmRecords || '{}') as Record<string, number>; } catch { return {}; } })();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-start gap-4">
                <Link href="/dashboard/plans" className="btn-ghost p-2 mt-1 self-start">
                    <ArrowLeft size={18} />
                </Link>
                <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                        <h1 className="text-2xl font-bold text-white">{plan.name}</h1>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-wider ${plan.status === 'active' ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' :
                            plan.status === 'completed' ? 'bg-blue-500/15 text-blue-300 border-blue-500/30' :
                                'bg-gray-500/15 text-gray-300 border-gray-500/30'
                            }`}>
                            {plan.status === 'active' ? 'Activo' : plan.status === 'draft' ? 'Borrador' : plan.status}
                        </span>
                    </div>
                    <p className="text-gray-400 mt-1">
                        {athlete.fullName} · {getCategoryLabel(athlete.category)} {athlete.gender === 'female' ? '♀' : '♂'} · Coach: {plan.coach.name}
                    </p>
                    {plan.description && <p className="text-sm text-gray-500 mt-2">{plan.description}</p>}
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                    {plan.competitionDate && (
                        <div className="glass rounded-xl px-4 py-2 text-center flex-1 md:flex-none">
                            <p className="text-xs text-gray-400">Competencia</p>
                            <p className="text-brand-400 font-bold text-sm tracking-wide">{formatDate(plan.competitionDate)}</p>
                        </div>
                    )}
                    {isAdmin && (
                        <Link href={`/dashboard/plans/${plan.id}/edit`} className="btn-brand bg-white/5 border border-white/10 text-white hover:bg-white/10 px-4 py-2 rounded-xl flex items-center justify-center gap-2 flex-1 md:flex-none">
                            <Edit2 size={16} /> <span className="hidden md:inline">Editar</span>
                        </Link>
                    )}
                </div>
            </div>

            {/* Athlete 1RM summary */}
            {Object.keys(oneRm).length > 0 && (
                <div className="glass rounded-2xl p-5">
                    <p className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2"><Target size={15} className="text-brand-400" /> Registros 1RM para Prescripción</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                        {Object.entries(oneRm).map(([key, val]) => (
                            <div key={key} className="bg-white/5 border border-white/5 rounded-xl p-3 text-center">
                                <p className="text-brand-400 font-bold text-lg">{String(val)}<span className="text-xs text-gray-500">kg</span></p>
                                <p className="text-xs text-gray-400 mt-1 capitalize">{key.replace(/_/g, ' ')}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ATR Timeline */}
            <div className="space-y-4">
                <div className="flex items-center justify-between mt-8 mb-2">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2"><Calendar size={18} className="text-brand-400" /> Mesociclos y Sesiones</h2>
                </div>

                {plan.mesocycles.map((meso: any) => {
                    const info = phaseInfo[meso.atrPhase];
                    const intensityRange = JSON.parse(meso.intensityRange || '{}');
                    const volumeRange = JSON.parse(meso.volumeSetsRange || '{}');

                    return (
                        <div key={meso.id} className="glass rounded-2xl overflow-hidden">
                            {/* Phase header */}
                            <div className="p-4 md:px-6 flex flex-col md:flex-row md:items-center gap-4 border-b border-white/8 bg-white/2">
                                <div className="flex items-center gap-3">
                                    <span className={`text-sm font-medium px-3 py-1.5 rounded-full ${info.cls}`}>
                                        {info.emoji} {info.label}
                                    </span>
                                </div>
                                <span className="text-gray-300 text-sm font-medium md:ml-2 border-l border-white/10 md:pl-4">{meso.primaryGoal}</span>

                                <div className="md:ml-auto flex flex-wrap gap-x-6 gap-y-2 text-xs">
                                    <div className="flex flex-col">
                                        <span className="text-gray-500">Duración</span>
                                        <span className="text-gray-300 font-medium">{meso.durationWeeks} semanas</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-gray-500">Intensidad</span>
                                        <span className="text-white font-medium">{intensityRange.min}–{intensityRange.max}% 1RM</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-gray-500">Volumen</span>
                                        <span className="text-white font-medium">{volumeRange.min}–{volumeRange.max} series/ej</span>
                                    </div>
                                </div>
                            </div>

                            {/* Sessions grid */}
                            {meso.sessions.length > 0 ? (
                                <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {Array.from({ length: meso.durationWeeks }, (_, wi) => {
                                        const weekSessions = meso.sessions.filter((s: any) => s.weekNumber === wi + 1);
                                        if (weekSessions.length === 0) return null;
                                        return (
                                            <div key={wi} className="space-y-3">
                                                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest pl-1">Semana {wi + 1}</p>
                                                <div className="space-y-2">
                                                    {weekSessions.map((session: any) => (
                                                        <div key={session.id} className="bg-white/5 border border-white/10 hover:border-brand-500/30 rounded-xl p-3 transition-colors group relative">
                                                            {isAdmin ? (
                                                                <Link href={`/dashboard/sessions/${session.id}/edit`} className="absolute inset-0 z-10" />
                                                            ) : (
                                                                <Link href={`/dashboard/sessions/${session.id}`} className="absolute inset-0 z-10" />
                                                            )}

                                                            <div className="flex items-center justify-between mb-2">
                                                                <div className="flex items-center gap-1.5">
                                                                    <div className={`w-2 h-2 rounded-full ${session.sessionType === 'power' ? 'bg-amber-400' : 'bg-brand-400'}`} />
                                                                    <span className="text-sm font-semibold text-white">{getDayLabel(session.dayOfWeek)}</span>
                                                                </div>
                                                                {isAdmin && (
                                                                    <Edit2 size={12} className="text-gray-500 group-hover:text-brand-400 opacity-0 group-hover:opacity-100 transition-opacity relative z-20 pointer-events-none" />
                                                                )}
                                                            </div>
                                                            <div className="flex justify-between items-end">
                                                                <div>
                                                                    <p className="text-xs text-gray-400 flex items-center gap-1">
                                                                        <Dumbbell size={11} /> {session.exercises.length} ejercicios
                                                                    </p>
                                                                    <p className="text-xs text-gray-500 mt-0.5">{session.estimatedDurationMin} min estim.</p>
                                                                </div>
                                                                {!isAdmin && (
                                                                    <button className="w-6 h-6 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center relative z-20 pointer-events-none">
                                                                        <Play size={10} className="ml-0.5" />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="p-8 text-center bg-white/2">
                                    <p className="text-gray-500 text-sm">Sin sesiones planificadas en este bloque.</p>
                                </div>
                            )}
                        </div>
                    );
                })}

                {plan.mesocycles.length === 0 && (
                    <div className="glass rounded-2xl p-12 text-center border-dashed border-white/20">
                        <Dumbbell size={32} className="mx-auto text-gray-600 mb-3" />
                        <p className="text-gray-400">Este plan está vacío.</p>
                        {isAdmin && <p className="text-sm text-brand-400 mt-2">Usa el botón de edición para agregar mesociclos y rutinas.</p>}
                    </div>
                )}
            </div>
        </div>
    );
}
