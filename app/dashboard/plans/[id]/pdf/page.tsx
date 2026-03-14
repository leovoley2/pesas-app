import { prisma } from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import { getDayLabel } from '@/lib/utils';
import { auth } from '@/lib/auth';
import PrintButton from '@/components/PrintButton';

const PHASE_LABELS: Record<string, string> = {
    accumulation: 'Acumulación',
    transformation: 'Transformación',
    realization: 'Realización',
};

export default async function PlanPdfViewPage({ params }: { params: { id: string } }) {
    const sessionToken = await auth();
    if (!sessionToken) redirect('/login');

    const plan = await prisma.trainingPlan.findUnique({
        where: { id: params.id },
        include: {
            athlete: { include: { user: true } },
            coach: true,
            mesocycles: {
                orderBy: { orderIndex: 'asc' },
                include: {
                    sessions: {
                        orderBy: [{ weekNumber: 'asc' }, { dayOfWeek: 'asc' }],
                        include: {
                            exercises: {
                                orderBy: { orderIndex: 'asc' },
                                include: { exercise: true }
                            }
                        }
                    }
                }
            }
        }
    });

    if (!plan) return notFound();

    const athlete = plan.athlete;

    // Simple RBAC
    const role = (sessionToken.user as any)?.role || 'athlete';
    const isAdmin = ['admin', 'coach'].includes(role);
    if (!isAdmin && athlete.userId !== sessionToken?.user?.id) {
        redirect('/dashboard/plans');
    }

    return (
        <div className="bg-white text-black min-h-screen p-8 max-w-4xl mx-auto print:p-0 font-sans print-page">
            <div className="print:hidden mb-6 flex justify-between items-center bg-gray-100 p-4 rounded-xl border border-gray-200">
                <p className="text-gray-600 text-sm">Vista optimizada para impresión en formato A4 (Libro completo).</p>
                <PrintButton />
            </div>

            {/* Print Cover Page Component (Optional, but nice to have) */}
            <div className="min-h-[80vh] flex flex-col justify-center text-center border-4 border-black p-12 mb-12 print-page-break">
                <h3 className="text-xl font-bold uppercase tracking-widest text-gray-500 mb-8">VB Fuerza — Programa de Entrenamiento</h3>
                <h1 className="text-5xl font-black uppercase tracking-tight mb-6 leading-tight">{plan.name}</h1>

                <div className="max-w-md mx-auto w-full border-t-2 border-b-2 border-black py-6 my-8 space-y-4">
                    <div>
                        <p className="text-xs uppercase font-bold text-gray-500">Atleta</p>
                        <p className="text-2xl font-bold">{athlete.fullName}</p>
                        <p className="text-sm text-gray-600 font-medium">Categoría {athlete.category} {athlete.gender === 'female' ? '(F)' : '(M)'}</p>
                    </div>
                </div>

                <div className="mt-auto pt-16 grid grid-cols-2 gap-8 text-left max-w-lg mx-auto w-full">
                    <div>
                        <p className="text-xs uppercase font-bold text-gray-500">Entrenador Principal</p>
                        <p className="font-bold text-lg">{plan.coach.name}</p>
                    </div>
                    {(plan.startDate || plan.endDate) && (
                        <div>
                            <p className="text-xs uppercase font-bold text-gray-500">Periodo</p>
                            <p className="font-bold text-lg">{plan.startDate ? new Date(plan.startDate).toLocaleDateString() : ''} — {plan.endDate ? new Date(plan.endDate).toLocaleDateString() : 'Pendiente'}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Loop over mesocycles and sessions */}
            {plan.mesocycles.map((meso: any, mIdx: number) => (
                <div key={meso.id} className="mb-12">
                    {/* Mesocycle Header */}
                    <div className="bg-black text-white p-4 mb-6 print:break-after-avoid">
                        <h2 className="text-2xl font-black uppercase tracking-widest">
                            Bloque {mIdx + 1}: {PHASE_LABELS[meso.atrPhase] ?? meso.atrPhase}
                        </h2>
                        <p className="text-sm font-medium opacity-80 mt-1">{meso.primaryGoal}</p>
                    </div>

                    {meso.sessions.length === 0 ? (
                        <p className="text-gray-500 text-sm italic p-4">Sin sesiones registradas en este bloque.</p>
                    ) : (
                        <div className="space-y-12">
                            {meso.sessions.map((session: any) => (
                                <div key={session.id} className="print-page-break-inside-avoid mb-10 border-2 border-gray-200 p-6 rounded-xl">
                                    {/* Session Header */}
                                    <div className="border-b-2 border-black pb-3 mb-4 flex justify-between items-end">
                                        <div>
                                            <h3 className="text-2xl font-black uppercase tracking-tight">Semana {session.weekNumber} — {getDayLabel(session.dayOfWeek)}</h3>
                                            <p className="text-sm text-gray-600 font-bold uppercase mt-1">Estimado: <span className="text-black">{session.estimatedDurationMin} min</span></p>
                                        </div>
                                    </div>

                                    {session.notes && (
                                        <div className="mb-4 bg-gray-50 p-3 rounded text-sm italic text-gray-700 border-l-4 border-gray-300">
                                            Coach: "{session.notes}"
                                        </div>
                                    )}

                                    {/* Exercises List Compact Table */}
                                    <table className="w-full text-left text-sm border-collapse">
                                        <thead>
                                            <tr className="border-b-2 border-gray-300 text-xs uppercase font-bold text-gray-500">
                                                <th className="py-2 pr-2">#</th>
                                                <th className="py-2 pr-2">Ejercicio</th>
                                                <th className="py-2 px-2 text-center">Series x Reps</th>
                                                <th className="py-2 px-2 text-center">% / Carga</th>
                                                <th className="py-2 px-2 text-center">Tempo/RPE</th>
                                                <th className="py-2 pl-2 text-right">Carga Real</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {session.exercises.map((ex: any) => (
                                                <tr key={ex.id} className="group">
                                                    <td className="py-3 pr-2 font-bold text-gray-400">{ex.orderIndex}</td>
                                                    <td className="py-3 pr-2">
                                                        <span className="font-bold text-black uppercase">{ex.exercise.name}</span>
                                                        {ex.isContrast && <span className="ml-2 text-[8px] bg-black text-white px-1 py-0.5 rounded uppercase">Contraste</span>}
                                                        {(ex.notes || ex.exercise.cues) && (
                                                            <p className="text-[10px] text-gray-500 mt-0.5 italic max-w-[200px] leading-tight font-medium">"{ex.notes || ex.exercise.cues}"</p>
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-2 text-center font-bold">
                                                        {ex.sets} × {ex.repsScheme}
                                                    </td>
                                                    <td className="py-3 px-2 text-center font-medium">
                                                        {ex.intensityPctRm ? `${ex.intensityPctRm}%` : (ex.loadKg ? `${ex.loadKg}kg` : 'Auto')}
                                                    </td>
                                                    <td className="py-3 px-2 text-center text-xs">
                                                        {ex.tempo ? `${ex.tempo} ` : ''}
                                                        {ex.rpeTarget ? `(RPE ${ex.rpeTarget})` : ''}
                                                    </td>
                                                    <td className="py-3 pl-2">
                                                        <div className="flex justify-end gap-1">
                                                            {Array.from({ length: Math.min(ex.sets, 5) }).map((_, i) => (
                                                                <div key={i} className="w-8 h-6 border border-gray-400 bg-gray-50 rounded shrink-0"></div>
                                                            ))}
                                                            {ex.sets > 5 && <span className="text-gray-400 text-xs self-center">+</span>}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {session.exercises.length === 0 && (
                                                <tr>
                                                    <td colSpan={6} className="py-6 text-center text-gray-400 italic font-medium">Sin ejercicios asignados</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ))}

            <div className="mt-8 pt-4 border-t-2 border-black flex justify-between text-xs font-bold text-gray-500 uppercase">
                <p>Generado por VB Fuerza</p>
                <p>Fecha de Impresión: {new Date().toLocaleDateString()}</p>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    @page { size: A4 portrait; margin: 1cm; }
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white; }
                    .print\\:hidden { display: none !important; }
                    .print-page-break { page-break-after: always; break-after: page; }
                    .print-page-break-inside-avoid { break-inside: avoid; page-break-inside: avoid; }
                }
            `}} />
        </div>
    );
}
