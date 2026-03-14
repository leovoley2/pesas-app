import { prisma } from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import { getDayLabel } from '@/lib/utils';
import { auth } from '@/lib/auth';
import PrintButton from '../../../../../components/PrintButton'; // we will create this

export default async function SessionPdfViewPage({ params }: { params: { id: string } }) {
    const sessionToken = await auth();
    if (!sessionToken) redirect('/login');

    const session = await prisma.trainingSession.findUnique({
        where: { id: params.id },
        include: {
            mesocycle: {
                include: { plan: { include: { athlete: { include: { user: true } }, coach: true } } }
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

    // Add simple RBAC
    const role = (sessionToken.user as any)?.role || 'athlete';
    const isAdmin = ['admin', 'coach'].includes(role);
    if (!isAdmin && athlete.userId !== sessionToken?.user?.id) {
        redirect('/dashboard/plans');
    }

    return (
        <div className="bg-white text-black min-h-screen p-8 max-w-4xl mx-auto print:p-0 font-sans print-page">
            <div className="print:hidden mb-6 flex justify-between items-center bg-gray-100 p-4 rounded-xl border border-gray-200">
                <p className="text-gray-600 text-sm">Vista optimizada para impresión en formato A4 (Vertical).</p>
                <PrintButton />
            </div>

            {/* Print Header */}
            <div className="border-b-4 border-black pb-4 mb-6">
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-black uppercase tracking-tight">Voleibol Fuerza — Rutina</h1>
                        <h2 className="text-xl font-bold mt-1 text-gray-800">{plan.name}</h2>
                    </div>
                    <div className="text-right">
                        <p className="font-bold text-lg uppercase">{getDayLabel(session.dayOfWeek)} — Semana {session.weekNumber}</p>
                        <p className="text-sm text-gray-600 font-medium">Fase: {session.mesocycle.atrPhase.toUpperCase()}</p>
                    </div>
                </div>
            </div>

            <div className="flex justify-between items-center mb-6 text-sm font-medium">
                <div>
                    <p><span className="text-gray-500 uppercase text-xs">Atleta:</span> {athlete.fullName}</p>
                    <p><span className="text-gray-500 uppercase text-xs">Categoría:</span> {athlete.category} {athlete.gender === 'female' ? '(F)' : '(M)'}</p>
                </div>
                <div className="text-right">
                    <p><span className="text-gray-500 uppercase text-xs">Entrenador:</span> {plan.coach.name}</p>
                    <p><span className="text-gray-500 uppercase text-xs">Duración est.:</span> {session.estimatedDurationMin} min</p>
                </div>
            </div>

            {session.notes && (
                <div className="mb-6 p-4 border-2 border-dashed border-gray-300 rounded-lg">
                    <p className="text-xs uppercase font-bold text-gray-500 mb-1">Notas del Entrenador</p>
                    <p className="italic text-sm">{session.notes}</p>
                </div>
            )}

            {/* Exercises List - Table format for PDF */}
            <div className="space-y-4">
                {session.exercises.map((ex: any) => (
                    <div key={ex.id} className="flex gap-4 border-b-2 border-gray-200 pb-4 break-inside-avoid">
                        {/* Image Box */}
                        <div className="w-32 h-32 border-2 border-black rounded-lg overflow-hidden shrink-0 flex items-center justify-center bg-gray-50">
                            {ex.exercise.imageUrl ? (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img src={ex.exercise.imageUrl} alt={ex.exercise.name} className="w-full h-full object-cover grayscale" crossOrigin="anonymous" />
                            ) : (
                                <span className="text-gray-300 text-xs font-bold text-center">FOTO<br />PENDIENTE</span>
                            )}
                        </div>

                        <div className="flex-1">
                            <div className="flex justify-between items-start mb-1">
                                <h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                                    <span className="bg-black text-white w-6 h-6 inline-flex items-center justify-center rounded-md text-sm shrink-0">{ex.orderIndex}</span>
                                    {ex.exercise.name}
                                </h3>
                                {ex.isContrast && (
                                    <span className="text-[10px] uppercase font-bold border-2 border-black px-1.5 py-0.5 rounded-md">Contraste</span>
                                )}
                            </div>

                            {(ex.notes || ex.exercise.cues) && (
                                <p className="text-sm italic text-gray-700 mb-2 leading-tight">
                                    " {ex.notes || ex.exercise.cues} "
                                </p>
                            )}

                            {/* Parameters Grid */}
                            <div className="grid grid-cols-4 gap-2 mt-2">
                                <div className="border border-gray-300 rounded p-1.5 text-center">
                                    <p className="text-[9px] uppercase font-bold text-gray-500">Series x Reps</p>
                                    <p className="font-bold text-sm">{ex.sets} × {ex.repsScheme}</p>
                                </div>
                                <div className="border border-gray-300 rounded p-1.5 text-center">
                                    <p className="text-[9px] uppercase font-bold text-gray-500">Carga / %1RM</p>
                                    <p className="font-bold text-sm">
                                        {ex.intensityPctRm ? `${ex.intensityPctRm}%` : (ex.loadKg ? `${ex.loadKg}kg` : 'Auto')}
                                    </p>
                                </div>
                                <div className="border border-gray-300 rounded p-1.5 text-center">
                                    <p className="text-[9px] uppercase font-bold text-gray-500">Descanso</p>
                                    <p className="font-bold text-sm">{ex.restSeconds}s</p>
                                </div>
                                <div className="border border-gray-300 rounded p-1.5 text-center">
                                    <p className="text-[9px] uppercase font-bold text-gray-500">Tempo / RPE</p>
                                    <p className="font-bold text-sm">
                                        {ex.tempo ? `${ex.tempo} ` : ''}
                                        {ex.rpeTarget ? `(RPE ${ex.rpeTarget})` : ''}
                                        {!ex.tempo && !ex.rpeTarget && '-'}
                                    </p>
                                </div>
                            </div>

                            {/* Write-in boxes for athletes */}
                            <div className="flex gap-2 mt-2">
                                <div className="text-[9px] font-bold text-gray-400 uppercase self-center w-16">Carga Real:</div>
                                {Array.from({ length: ex.sets }).map((_, i) => (
                                    <div key={i} className="flex-1 h-6 border border-gray-300 bg-gray-50 rounded"></div>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

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
                    .break-inside-avoid { break-inside: avoid; page-break-inside: avoid; }
                }
            `}} />
        </div>
    );
}
