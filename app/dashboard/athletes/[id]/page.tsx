import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { ArrowLeft, Edit2, Download, Calendar, Activity, Info } from 'lucide-react';
import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getCategoryLabel, getGenderLabel } from '@/lib/utils';
import { redirect } from 'next/navigation';

export default async function AthleteDetailPage({ params }: { params: { id: string } }) {
    const session = await auth();
    if (!session) redirect('/login');
    const isAdmin = ['admin', 'coach'].includes((session?.user as any)?.role || '');

    const athlete = await prisma.athleteProfile.findUnique({
        where: { id: params.id },
        include: {
            user: { select: { email: true } },
            plans: {
                orderBy: { createdAt: 'desc' },
                include: { mesocycles: { orderBy: { orderIndex: 'asc' } } }
            },
            loadLogs: {
                orderBy: { date: 'desc' },
                take: 10,
                include: { sessionExercise: { include: { exercise: true } } }
            }
        }
    });

    if (!athlete) return notFound();

    const oneRm = (() => { try { return JSON.parse(athlete.oneRmRecords || '{}') as Record<string, number>; } catch { return {}; } })();

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex items-center gap-3">
                <Link href="/dashboard/athletes" className="btn-ghost p-2">
                    <ArrowLeft size={18} />
                </Link>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        {athlete.fullName}
                    </h1>
                    <p className="text-gray-400 text-sm mt-0.5">{athlete.user.email}</p>
                </div>
                {isAdmin && (
                    <Link href={`/dashboard/athletes/${athlete.id}/edit`} className="btn-brand flex items-center gap-2">
                        <Edit2 size={16} /> Editar Perfil
                    </Link>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* BIO CARD */}
                <div className="glass rounded-2xl p-6 space-y-6 self-start">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-brand-500/30 to-blue-500/30 rounded-full flex items-center justify-center text-3xl flex-shrink-0 border border-white/10">
                            {athlete.gender === 'female' ? '👩' : '👨'}
                        </div>
                        <div>
                            <span className={`text-xs px-2.5 py-1 rounded-full border mb-2 inline-block font-medium bg-brand-500/15 text-brand-300 border-brand-500/30`}>
                                {getCategoryLabel(athlete.category)}
                            </span>
                            <div className="flex gap-2 text-sm text-gray-400">
                                <span>{athlete.bodyWeightKg}kg</span> •
                                <span>{athlete.position === 'defender' ? 'Zaguero/Líbero' : 'Bloqueador/Atte.'}</span>
                            </div>
                        </div>
                    </div>

                    {athlete.notes && (
                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mt-4">
                            <h3 className="text-amber-400 text-sm font-semibold flex items-center gap-2 mb-1.5"><Info size={14} /> Notas de salud/coach</h3>
                            <p className="text-sm text-amber-200/80 leading-relaxed">{athlete.notes}</p>
                        </div>
                    )}

                    <div className="space-y-3 pt-4 border-t border-white/10">
                        <h3 className="text-sm font-semibold text-white">Records 1RM</h3>
                        {Object.keys(oneRm).length > 0 ? (
                            <div className="grid grid-cols-2 gap-2">
                                {Object.entries(oneRm).map(([key, val]) => (
                                    <div key={key} className="bg-white/5 rounded-lg p-3 text-center">
                                        <p className="text-brand-400 font-bold">{val}kg</p>
                                        <p className="text-xs text-gray-500 capitalize">{key.replace(/_/g, ' ')}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500">No hay 1RMs registrados.</p>
                        )}
                    </div>
                </div>

                {/* PLANS & LOGS */}
                <div className="md:col-span-2 space-y-6">
                    {/* Plans */}
                    <div className="glass rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                <Calendar size={18} className="text-brand-400" /> Planes de Entrenamiento
                            </h3>
                            {isAdmin && (
                                <Link href={`/dashboard/plans/new?athleteId=${athlete.id}`} className="text-sm text-brand-400 hover:text-brand-300">
                                    + Crear Plan
                                </Link>
                            )}
                        </div>

                        {athlete.plans.length === 0 ? (
                            <div className="border border-dashed border-white/10 rounded-xl p-8 text-center bg-white/2">
                                <p className="text-gray-500 text-sm">El atleta aún no tiene un plan activo.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {athlete.plans.map(plan => (
                                    <div key={plan.id} className="border border-white/10 bg-white/5 rounded-xl p-4 hover:bg-white/8 transition-colors">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Link href={`/dashboard/plans/${plan.id}`} className="font-semibold text-white hover:text-brand-400 focus:outline-none">{plan.name}</Link>
                                                    <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-wider ${plan.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : plan.status === 'completed' ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-500/20 text-gray-400'}`}>
                                                        {plan.status}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-400">
                                                    {plan.startDate.toLocaleDateString()} — {plan.endDate.toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div className="flex gap-2">
                                                <a href={`/dashboard/plans/${plan.id}/pdf`} className="p-2 rounded-lg bg-brand-500/10 text-brand-400 hover:bg-brand-500/20" title="Descargar Plan Completo">
                                                    <Download size={14} />
                                                </a>
                                            </div>
                                        </div>
                                        <div className="flex gap-1.5 mt-3">
                                            {plan.mesocycles.map((m, i) => (
                                                <div key={m.id} className={`h-1.5 flex-1 rounded-full ${m.atrPhase === 'accumulation' ? 'bg-blue-500/50' : m.atrPhase === 'transformation' ? 'bg-amber-500/50' : 'bg-emerald-500/50'}`} />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Workload Log history preview */}
                    <div className="glass rounded-2xl p-6">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
                            <Activity size={18} className="text-brand-400" /> Historial de Carga Diaria (Reciente)
                        </h3>
                        {athlete.loadLogs.length === 0 ? (
                            <div className="text-center py-6 text-gray-500 text-sm">No hay registros de sesiones.</div>
                        ) : (
                            <div className="divide-y divide-white/5">
                                {athlete.loadLogs.map(log => (
                                    <div key={log.id} className="py-3 flex justify-between items-center text-sm">
                                        <div>
                                            <p className="text-white font-medium">{log.sessionExercise.exercise.name}</p>
                                            <p className="text-xs text-gray-500">{new Date(log.date).toLocaleDateString()}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-brand-400 font-semibold">{log.actualSets} sets x {log.actualLoadKg}kg</p>
                                            <p className="text-xs text-gray-400">RPE: {log.rpeActual}/10</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
