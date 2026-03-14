import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Users, ClipboardList, TrendingUp, AlertTriangle, ArrowRight, Zap, Play, Calendar } from 'lucide-react';
import { getDayLabel } from '@/lib/utils';

export default async function DashboardPage() {
    const session = await auth();
    const userId = (session?.user as any)?.id;
    const role = (session?.user as any)?.role || 'athlete';
    const isAdmin = ['admin', 'coach'].includes(role);

    const phaseColors: Record<string, string> = {
        accumulation: 'phase-accumulation',
        transformation: 'phase-transformation',
        realization: 'phase-realization',
    };
    const phaseLabels: Record<string, string> = {
        accumulation: 'Acumulación',
        transformation: 'Transformación',
        realization: 'Realización',
    };
    const rpeColor = (rpe: number | null) => {
        if (!rpe) return 'text-gray-500';
        if (rpe <= 5) return 'rpe-low';
        if (rpe <= 7) return 'rpe-mid';
        if (rpe <= 9) return 'rpe-high';
        return 'rpe-max';
    };

    if (isAdmin) {
        // --- ADMIN / COACH DASHBOARD ---
        const [athleteCount, planCount, recentLogs] = await Promise.all([
            prisma.athleteProfile.count(),
            prisma.trainingPlan.count({ where: { status: 'active' } }),
            prisma.loadLog.findMany({
                take: 8,
                orderBy: { date: 'desc' },
                include: {
                    athlete: { select: { fullName: true, category: true } },
                    sessionExercise: { include: { exercise: { select: { name: true } } } },
                },
            }),
        ]);

        const highRpeCount = recentLogs.filter(l => (l.rpeActual ?? 0) >= 8).length;
        const avgReadiness = recentLogs.filter(l => l.readinessScore).length > 0
            ? (recentLogs.reduce((a, l) => a + (l.readinessScore ?? 0), 0) / recentLogs.filter(l => l.readinessScore).length).toFixed(1)
            : 'N/A';

        const stats = [
            { label: 'Atletas Activos', value: athleteCount, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/15', link: '/dashboard/athletes' },
            { label: 'Planes ATR Activos', value: planCount, icon: ClipboardList, color: 'text-brand-400', bg: 'bg-brand-500/15', link: '/dashboard/plans' },
            { label: 'RPE Alto (recientes)', value: highRpeCount, icon: AlertTriangle, color: 'text-orange-400', bg: 'bg-orange-500/15', link: '/dashboard/monitoring' },
            { label: 'Readiness Promedio', value: avgReadiness + (avgReadiness !== 'N/A' ? '/10' : ''), icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/15', link: '/dashboard/monitoring' },
        ];

        const activePlans = await prisma.trainingPlan.findMany({
            where: { status: 'active' },
            take: 4,
            include: {
                athlete: { select: { fullName: true, category: true, gender: true } },
                mesocycles: { orderBy: { orderIndex: 'asc' }, take: 1 },
            },
            orderBy: { createdAt: 'desc' },
        });

        return (
            <div className="space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-white">Panel de Control</h1>
                        <p className="text-gray-400 mt-1">Bienvenido, <span className="text-brand-400 font-medium">{session?.user?.name}</span> · {role === 'coach' ? '🏅 Entrenador' : '⚙️ Admin'}</p>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {stats.map(({ label, value, icon: Icon, color, bg, link }) => (
                        <Link key={label} href={link} className="glass rounded-2xl p-5 card-hover group">
                            <div className="flex items-start gap-3">
                                <div className={`${bg} p-2.5 rounded-xl`}>
                                    <Icon size={20} className={color} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-2xl font-bold text-white mt-0.5">{value}</p>
                                    <p className="text-xs text-gray-400 mt-1 leading-tight">{label}</p>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    {/* Active Plans */}
                    <div className="lg:col-span-3 glass rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-lg font-semibold text-white">Planes ATR Activos</h2>
                            <Link href="/dashboard/plans" className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 transition-colors">
                                Ver todos <ArrowRight size={12} />
                            </Link>
                        </div>
                        {activePlans.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <ClipboardList size={40} className="mx-auto mb-3 opacity-30" />
                                <p>No hay planes activos aún</p>
                                <Link href="/dashboard/plans/new" className="text-brand-400 text-sm mt-2 inline-block hover:underline">Crear el primer plan →</Link>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {activePlans.map(plan => {
                                    const currentPhase = plan.mesocycles[0];
                                    return (
                                        <Link key={plan.id} href={`/dashboard/plans/${plan.id}`}
                                            className="flex flex-col md:flex-row md:items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/8 transition-all duration-200 group border border-transparent hover:border-white/10">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-white truncate">{plan.name}</p>
                                                <p className="text-xs text-gray-400 mt-0.5">{plan.athlete.fullName} · {plan.athlete.category} {plan.athlete.gender === 'female' ? '♀' : '♂'}</p>
                                            </div>
                                            <div className="flex items-center justify-between md:justify-end gap-4 w-full md:w-auto">
                                                {currentPhase && (
                                                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${phaseColors[currentPhase.atrPhase]}`}>
                                                        {phaseLabels[currentPhase.atrPhase]}
                                                    </span>
                                                )}
                                                <ArrowRight size={14} className="text-gray-600 group-hover:text-brand-400 transition-colors hidden md:block" />
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Recent Load Logs */}
                    <div className="lg:col-span-2 glass rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-lg font-semibold text-white">Monitoreo de Carga Reciente</h2>
                            <Link href="/dashboard/monitoring" className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 transition-colors">
                                Ver más <ArrowRight size={12} />
                            </Link>
                        </div>
                        {recentLogs.length === 0 ? (
                            <div className="text-center py-8 text-gray-500 text-sm">Sin registros aún</div>
                        ) : (
                            <div className="space-y-2">
                                {recentLogs.map(log => (
                                    <div key={log.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium text-white truncate">{log.sessionExercise.exercise.name}</p>
                                            <p className="text-xs text-brand-400/80 mt-0.5 truncate">{log.athlete.fullName}</p>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <div className="flex items-center justify-end gap-2">
                                                {log.actualLoadKg && <span className="text-xs font-medium text-gray-300">{log.actualLoadKg}kg</span>}
                                                {log.rpeActual && <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${rpeColor(log.rpeActual).replace('text-', 'bg-').replace('rpe-', 'bg-red-500/10 text-red-')} border border-current/20`}>RPE {log.rpeActual}</span>}
                                            </div>
                                            <p className="text-[10px] text-gray-500 mt-1">{new Date(log.date).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    } else {
        // --- ATHLETE DASHBOARD ---
        const athlete = await prisma.athleteProfile.findUnique({
            where: { userId },
            include: {
                plans: {
                    where: { status: 'active' },
                    include: {
                        mesocycles: {
                            orderBy: { orderIndex: 'asc' },
                            include: {
                                sessions: {
                                    orderBy: [{ weekNumber: 'asc' }, { dayOfWeek: 'asc' }],
                                    include: { exercises: { select: { id: true } } }
                                }
                            }
                        }
                    }
                },
                loadLogs: {
                    take: 5,
                    orderBy: { date: 'desc' },
                    include: { sessionExercise: { include: { exercise: { select: { name: true } } } } }
                }
            }
        });

        const activePlan = athlete?.plans[0];

        // Find next session logic (simplified: just grab the first session of the current mesocycle)
        // In a real scenario we'd match with the current date
        const currentMeso = activePlan?.mesocycles[0];
        const nextSession = currentMeso?.sessions[0];

        return (
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-white">Mi Entrenamiento</h1>
                        <p className="text-gray-400 mt-1">Hola, <span className="text-brand-400 font-medium">{session?.user?.name}</span></p>
                    </div>
                </div>

                {!activePlan ? (
                    <div className="glass rounded-2xl p-12 text-center border-dashed border-white/20">
                        <Calendar size={48} className="mx-auto text-gray-600 mb-4" />
                        <h2 className="text-xl font-semibold text-white mb-2">Sin plan de entrenamiento activo</h2>
                        <p className="text-gray-400">Tu entrenador aún no ha asignado un bloque de entrenamiento activo para ti. Consulta con él.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* Current Plan Overview */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="glass rounded-2xl p-6 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 blur-3xl -mr-20 -mt-20 rounded-full pointer-events-none" />
                                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-1">Plan Actual</h2>
                                <div className="flex items-start justify-between">
                                    <h3 className="text-2xl font-bold text-white mb-4">{activePlan.name}</h3>
                                    <Link href={`/dashboard/plans/${activePlan.id}`} className="btn-brand bg-white/10 hover:bg-white/20 text-white border-white/10 flex items-center gap-2 px-4 py-2 text-sm rounded-xl">
                                        Ver Plan Completo <ArrowRight size={14} />
                                    </Link>
                                </div>

                                {currentMeso && (
                                    <div className="mt-4 p-4 rounded-xl bg-black/20 border border-white/10">
                                        <p className="text-sm text-gray-400 mb-2">Bloque Actual:</p>
                                        <div className="flex items-center gap-3">
                                            <span className={`px-3 py-1.5 rounded-full text-sm font-bold ${phaseColors[currentMeso.atrPhase]}`}>
                                                {phaseLabels[currentMeso.atrPhase]}
                                            </span>
                                            <span className="text-gray-300 font-medium text-sm">{currentMeso.primaryGoal}</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Next Workout */}
                            {nextSession && (
                                <div className="glass rounded-2xl p-6 border-brand-500/30">
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                                            <Zap size={20} className="text-brand-400" /> Siguiente Rutina
                                        </h2>
                                    </div>
                                    <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                                        <div className="flex items-center justify-between mb-4">
                                            <div>
                                                <p className="text-sm font-bold text-brand-400 uppercase tracking-widest mb-1">Semana {nextSession.weekNumber}</p>
                                                <p className="text-xl font-bold text-white">{getDayLabel(nextSession.dayOfWeek)}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm text-gray-400">{nextSession.exercises.length} Ejercicios</p>
                                                <p className="text-sm text-gray-400">~{nextSession.estimatedDurationMin} min</p>
                                            </div>
                                        </div>

                                        <Link href={`/dashboard/sessions/${nextSession.id}`} className="btn-brand w-full py-3 flex justify-center items-center gap-2 text-base mt-2 shadow-lg shadow-brand-500/20">
                                            <Play size={18} /> Iniciar Sesión de Entrenamiento
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Athlete Stats & Logs */}
                        <div className="space-y-6">
                            <div className="glass rounded-2xl p-6">
                                <h3 className="text-lg font-semibold text-white mb-4 flex items-center justify-between">
                                    Progreso Reciente
                                    <TrendingUp size={18} className="text-emerald-400" />
                                </h3>

                                {(!athlete?.loadLogs || athlete.loadLogs.length === 0) ? (
                                    <p className="text-sm text-gray-500 text-center py-4">No has registrado cargas aún.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {athlete.loadLogs.map(log => (
                                            <div key={log.id} className="bg-white/5 rounded-xl p-3 border border-white/5">
                                                <p className="text-sm font-medium text-white line-clamp-1 mb-1">{log.sessionExercise.exercise.name}</p>
                                                <div className="flex justify-between items-end">
                                                    <span className="text-xs text-gray-500">{new Date(log.date).toLocaleDateString()}</span>
                                                    <span className="text-sm font-bold text-brand-400">{log.actualLoadKg} kg <span className="text-gray-500 text-xs font-normal">x {log.actualSets} sets</span></span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }
}
