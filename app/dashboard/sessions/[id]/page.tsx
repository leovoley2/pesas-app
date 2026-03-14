import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getDayLabel } from '@/lib/utils';
import { ArrowLeft, Play, Dumbbell, CheckCircle2, Download, Info } from 'lucide-react';
import { auth } from '@/lib/auth';

const TYPE_BADGE: Record<string, string> = {
    compound: 'bg-blue-500/15 text-blue-300',
    olympic: 'bg-amber-500/15 text-amber-300',
    ballistic: 'bg-orange-500/15 text-orange-300',
    plyometric_low: 'bg-yellow-500/15 text-yellow-300',
    plyometric_high: 'bg-red-500/15 text-red-300',
    transfer: 'bg-emerald-500/15 text-emerald-300',
    accessory: 'bg-gray-500/15 text-gray-400',
};

const PHASE_LABELS: Record<string, string> = {
    accumulation: '📦 Acumulación',
    transformation: '⚡ Transformación',
    realization: '🏆 Realización',
};

export default async function SessionViewPage({ params }: { params: { id: string } }) {
    const sessionToken = await auth();
    if (!sessionToken) redirect('/login');

    const session = await prisma.trainingSession.findUnique({
        where: { id: params.id },
        include: {
            mesocycle: {
                include: { plan: { include: { athlete: true } } }
            },
            exercises: {
                orderBy: { orderIndex: 'asc' },
                include: { exercise: true }
            }
        }
    });

    if (!session) return notFound();

    const plan = session.mesocycle.plan;
    const athlete = plan.athlete;
    const isAdmin = ['admin', 'coach'].includes((sessionToken.user as any)?.role || '');

    // Security check: athlete can only view their own session
    if (!isAdmin && athlete.userId !== sessionToken?.user?.id) {
        redirect('/dashboard/plans');
    }

    const phaseLabel = PHASE_LABELS[session.mesocycle.atrPhase] ?? session.mesocycle.atrPhase;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-start gap-4">
                <Link href={`/dashboard/plans/${plan.id}`} className="btn-ghost p-2 self-start mt-1">
                    <ArrowLeft size={18} />
                </Link>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        Rutina: {getDayLabel(session.dayOfWeek)} — Semana {session.weekNumber}
                    </h1>
                    <div className="flex items-center flex-wrap gap-2 gap-y-1 mt-2 text-sm text-gray-400">
                        <span className="text-brand-400 font-medium">{plan.name}</span>
                        <span>•</span>
                        <span className="bg-white/10 px-2 py-0.5 rounded-md text-white">{phaseLabel}</span>
                        <span>•</span>
                        <span>Duración est: {session.estimatedDurationMin} min</span>
                    </div>
                </div>
                <div className="flex gap-2">
                    <a href={`/dashboard/sessions/${session.id}/pdf`} className="btn-brand bg-white/5 border border-white/10 text-white hover:bg-white/10 px-4 py-2 rounded-xl flex items-center gap-2">
                        <Download size={16} /> PDF
                    </a>
                </div>
            </div>

            {session.notes && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex gap-3 text-blue-200">
                    <Info size={18} className="text-blue-400 shrink-0 mt-0.5" />
                    <div>
                        <p className="font-semibold text-sm text-blue-400 mb-1">Notas del Entrenador para hoy</p>
                        <p className="text-sm">{session.notes}</p>
                    </div>
                </div>
            )}

            {/* Exercises viewer */}
            <div className="glass rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
                    <h2 className="font-semibold text-white flex items-center gap-2">
                        <Dumbbell size={18} className="text-brand-400" />
                        Lista de Ejercicios ({session.exercises.length})
                    </h2>
                </div>

                {session.exercises.length === 0 ? (
                    <div className="py-12 text-center text-gray-500 text-sm">El entrenador aún no ha cargado los ejercicios de esta sesión.</div>
                ) : (
                    <div className="divide-y divide-white/5">
                        {session.exercises.map((ex, idx) => {
                            const typeClass = TYPE_BADGE[ex.exercise.exerciseType ?? 'compound'] ?? TYPE_BADGE.compound;

                            return (
                                <div key={ex.id} className="p-4 md:p-6 hover:bg-white/2 transition-colors flex flex-col md:flex-row gap-4 md:gap-6">
                                    <div className="flex items-start gap-4 flex-1">
                                        <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-bold text-gray-400">
                                            {ex.orderIndex}
                                        </div>
                                        {/* Exercise Image */}
                                        {ex.exercise.imageUrl && (
                                            <div className="hidden md:block w-24 h-24 rounded-xl overflow-hidden shrink-0 border border-white/10 bg-black/20">
                                                <img src={ex.exercise.imageUrl} alt={ex.exercise.name} className="w-full h-full object-cover" />
                                            </div>
                                        )}
                                        <div className="flex-1">
                                            <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                                <h3 className="font-semibold text-lg text-white">{ex.exercise.name}</h3>
                                                <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-wider ${typeClass}`}>
                                                    {ex.exercise.exerciseType ?? 'compound'}
                                                </span>
                                                {ex.isContrast && (
                                                    <span className="text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-wider bg-amber-500/15 text-amber-300">⚡ PAP Contraste</span>
                                                )}
                                            </div>

                                            {/* Description / Cues */}
                                            {ex.notes ? (
                                                <p className="text-sm text-brand-300 font-medium mb-3 italic">Coach: "{ex.notes}"</p>
                                            ) : ex.exercise.cues ? (
                                                <p className="text-sm text-gray-400/80 mb-3">{ex.exercise.cues}</p>
                                            ) : null}

                                            {/* Dosage parameters grid */}
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mt-2">
                                                <div className="bg-white/5 rounded-lg p-2.5">
                                                    <p className="text-[10px] text-gray-500 uppercase font-bold">Series x Reps</p>
                                                    <p className="font-semibold text-white">{ex.sets} × <span className="text-brand-400">{ex.repsScheme}</span></p>
                                                </div>
                                                <div className="bg-white/5 rounded-lg p-2.5">
                                                    <p className="text-[10px] text-gray-500 uppercase font-bold">Intensidad / Carga</p>
                                                    <p className="font-semibold text-white">{ex.intensityPctRm ? `${ex.intensityPctRm}% 1RM` : (ex.loadKg ? `${ex.loadKg}kg` : 'Auto/Peso Corp.')}</p>
                                                </div>
                                                <div className="bg-white/5 rounded-lg p-2.5">
                                                    <p className="text-[10px] text-gray-500 uppercase font-bold">Descanso</p>
                                                    <p className="font-semibold text-white">{ex.restSeconds}s</p>
                                                </div>
                                                <div className="bg-white/5 rounded-lg p-2.5">
                                                    <p className="text-[10px] text-gray-500 uppercase font-bold">Tempo / RPE</p>
                                                    <p className="font-semibold text-white">
                                                        {ex.tempo ? `${ex.tempo} ` : ''}
                                                        {ex.rpeTarget ? <span className="text-amber-400">RPE {ex.rpeTarget}</span> : ''}
                                                        {!ex.tempo && !ex.rpeTarget && 'Normal'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Action button inside card (visual only for now) */}
                                    <div className="flex md:flex-col items-center md:justify-center border-t border-white/5 md:border-t-0 md:border-l pt-3 md:pt-0 pb-1 md:pl-6">
                                        <button className="flex items-center justify-center gap-2 w-full md:w-auto px-4 py-2.5 rounded-xl bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 transition-colors text-sm font-semibold border border-brand-500/30">
                                            <CheckCircle2 size={18} /> <span className="md:hidden">Marcar Completado</span>
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* End session call to action */}
            {session.exercises.length > 0 && (
                <div className="flex justify-end pt-4 pb-12">
                    <button className="btn-brand flex items-center gap-2 px-8 py-3 text-base shadow-lg shadow-brand-500/20">
                        <CheckCircle2 size={20} /> Terminar Sesión e Ingresar Cargas
                    </button>
                </div>
            )}
        </div>
    );
}
