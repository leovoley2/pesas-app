'use client';
import { useState, useEffect } from 'react';
import { Loader2, CheckCircle, Activity, AlertCircle } from 'lucide-react';

interface SessionExercise {
    id: string;
    exercise: { name: string; imageUrl: string | null; muscleGroups: string };
    sets: number;
    repsScheme: string;
    loadKg: number | null;
    intensityPctRm: number | null;
    rpeTarget: number | null;
    restSeconds: number;
}

interface TrainingSession {
    id: string;
    weekNumber: number;
    dayOfWeek: string;
    mesocycle: { atrPhase: string; plan: { name: string; athlete: { id: string; fullName: string } } };
    exercises: SessionExercise[];
}

const dayLabel: Record<string, string> = {
    monday: 'Lunes', tuesday: 'Martes', wednesday: 'Miércoles',
    thursday: 'Jueves', friday: 'Viernes', saturday: 'Sábado', sunday: 'Domingo',
};
const phaseLabel: Record<string, string> = {
    accumulation: '📦 Acumulación', transformation: '⚡ Transformación', realization: '🏆 Realización',
};
const rpeColors: Record<number, string> = {
    1: 'bg-emerald-600', 2: 'bg-emerald-500', 3: 'bg-emerald-400',
    4: 'bg-green-400', 5: 'bg-yellow-400', 6: 'bg-yellow-500',
    7: 'bg-orange-400', 8: 'bg-orange-500', 9: 'bg-red-500', 10: 'bg-red-600',
};

interface ExerciseLog {
    actualSets: number;
    actualLoadKg: string;
    actualReps: number[];
    rpeActual: number;
    notes: string;
}

export default function LoadLogPage() {
    const [sessions, setSessions] = useState<TrainingSession[]>([]);
    const [selectedSession, setSelectedSession] = useState<TrainingSession | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);
    const [saved, setSaved] = useState<Set<string>>(new Set());
    const [readiness, setReadiness] = useState(7);
    const [logs, setLogs] = useState<Record<string, ExerciseLog>>({});

    useEffect(() => {
        // Get user's active sessions (demo: fetch all recent sessions)
        fetch('/api/sessions/recent')
            .then(r => r.ok ? r.json() : [])
            .then(data => { setSessions(data); if (data.length > 0) setSelectedSession(data[0]); })
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    const initLog = (ex: SessionExercise): ExerciseLog => ({
        actualSets: ex.sets,
        actualLoadKg: ex.loadKg?.toString() ?? '',
        actualReps: Array(ex.sets).fill(parseInt(ex.repsScheme.split('x')[1]) || 8),
        rpeActual: ex.rpeTarget ?? 7,
        notes: '',
    });

    const getLog = (ex: SessionExercise) => logs[ex.id] ?? initLog(ex);
    const updateLog = (exId: string, patch: Partial<ExerciseLog>) =>
        setLogs(prev => ({ ...prev, [exId]: { ...getLog({ id: exId } as any), ...patch } }));

    const saveExerciseLog = async (ex: SessionExercise) => {
        const log = getLog(ex);
        setSaving(ex.id);
        try {
            const athleteId = selectedSession?.mesocycle.plan.athlete.id ?? '';
            await fetch('/api/load-logs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionExerciseId: ex.id,
                    athleteId,
                    actualSets: log.actualSets,
                    actualReps: log.actualReps,
                    actualLoadKg: parseFloat(log.actualLoadKg) || null,
                    rpeActual: log.rpeActual,
                    readinessScore: readiness,
                    notes: log.notes || null,
                }),
            });
            setSaved(prev => new Set([...prev, ex.id]));
        } catch {
            alert('Error al guardar. Intenta nuevamente.');
        } finally {
            setSaving(null);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <Loader2 size={32} className="animate-spin text-brand-400" />
        </div>
    );

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <Activity size={28} className="text-brand-400" /> Registro de Carga Diaria
                </h1>
                <p className="text-gray-400 mt-1">Registra la carga real ejecutada en tu sesión de hoy</p>
            </div>

            {/* Readiness global */}
            <div className="glass rounded-2xl p-5">
                <div className="flex items-center gap-4 flex-wrap">
                    <div>
                        <p className="text-sm font-semibold text-white mb-1">¿Cómo te sientes hoy? <span className="text-brand-400">Readiness General</span></p>
                        <p className="text-xs text-gray-500">Considera sueño, estrés, dolor muscular y energía</p>
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                        <span className="text-xs text-gray-500">Muy malo</span>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                            <button key={n} type="button" onClick={() => setReadiness(n)}
                                className={`w-9 h-9 rounded-xl text-sm font-bold transition-all border ${readiness === n ? `${rpeColors[n]} border-transparent text-white scale-110 shadow-lg` : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'}`}>
                                {n}
                            </button>
                        ))}
                        <span className="text-xs text-gray-500">Óptimo</span>
                    </div>
                </div>
            </div>

            {/* Session selector */}
            {sessions.length === 0 ? (
                <div className="glass rounded-2xl p-16 text-center">
                    <AlertCircle size={40} className="mx-auto mb-3 text-gray-500 opacity-50" />
                    <p className="text-gray-300 font-semibold">Sin sesiones disponibles</p>
                    <p className="text-gray-500 text-sm mt-2">El entrenador debe crear sesiones en tu plan ATR primero</p>
                </div>
            ) : (
                <>
                    {/* Session tabs */}
                    {sessions.length > 1 && (
                        <div className="flex gap-2 flex-wrap">
                            {sessions.map(s => (
                                <button key={s.id} onClick={() => setSelectedSession(s)}
                                    className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${selectedSession?.id === s.id ? 'bg-brand-500/15 border-brand-500/40 text-brand-300' : 'border-white/10 text-gray-400 hover:border-white/20'}`}>
                                    Semana {s.weekNumber} · {dayLabel[s.dayOfWeek]}
                                </button>
                            ))}
                        </div>
                    )}

                    {selectedSession && (
                        <div className="space-y-4">
                            {/* Session header */}
                            <div className="glass rounded-2xl p-4 flex items-center gap-4">
                                <div>
                                    <p className="font-semibold text-white">{selectedSession.mesocycle.plan.name}</p>
                                    <p className="text-sm text-gray-400">
                                        Semana {selectedSession.weekNumber} · {dayLabel[selectedSession.dayOfWeek]} ·
                                        <span className="ml-1">{phaseLabel[selectedSession.mesocycle.atrPhase]}</span>
                                    </p>
                                </div>
                                <div className="ml-auto text-sm text-gray-400">
                                    {saved.size}/{selectedSession.exercises.length} ejercicios guardados
                                </div>
                            </div>

                            {/* Progress bar */}
                            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-brand-500 rounded-full transition-all duration-500"
                                    style={{ width: `${(saved.size / selectedSession.exercises.length) * 100}%` }}
                                />
                            </div>

                            {/* Exercise logs */}
                            {selectedSession.exercises.map(ex => {
                                const log = getLog(ex);
                                const isSaved = saved.has(ex.id);
                                const isSaving = saving === ex.id;

                                return (
                                    <div key={ex.id} className={`glass rounded-2xl overflow-hidden transition-all ${isSaved ? 'border border-emerald-500/30 opacity-80' : 'border border-transparent'}`}>
                                        {/* Exercise header */}
                                        <div className="p-4 border-b border-white/8 flex items-center gap-3">
                                            <div className="w-11 h-11 bg-navy-700 rounded-xl flex items-center justify-center text-xl flex-shrink-0 border border-white/10">
                                                {ex.exercise.imageUrl ? (
                                                    <img src={ex.exercise.imageUrl} alt={ex.exercise.name} className="w-full h-full object-cover rounded-xl" />
                                                ) : '💪'}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-semibold text-white">{ex.exercise.name}</p>
                                                <p className="text-xs text-gray-500">Planificado: {ex.repsScheme} @ {ex.loadKg ?? '—'}kg · RPE objetivo: {ex.rpeTarget ?? '—'}</p>
                                            </div>
                                            {isSaved && <CheckCircle size={20} className="text-emerald-400 flex-shrink-0" />}
                                        </div>

                                        {/* Log form */}
                                        <div className="p-4 space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-xs text-gray-400 block mb-1.5 font-medium">Carga real (kg)</label>
                                                    <input type="number" min={0} max={500} step={2.5}
                                                        value={log.actualLoadKg}
                                                        onChange={e => updateLog(ex.id, { actualLoadKg: e.target.value })}
                                                        className="input-field text-center font-bold text-brand-400 text-lg"
                                                        placeholder={ex.loadKg?.toString() ?? '0'} />
                                                </div>
                                                <div>
                                                    <label className="text-xs text-gray-400 block mb-1.5 font-medium">Sets completados</label>
                                                    <input type="number" min={0} max={10}
                                                        value={log.actualSets}
                                                        onChange={e => updateLog(ex.id, { actualSets: parseInt(e.target.value) || 0, actualReps: Array(parseInt(e.target.value) || 0).fill(log.actualReps[0] ?? 8) })}
                                                        className="input-field text-center font-bold text-brand-400 text-lg" />
                                                </div>
                                            </div>

                                            {/* Reps per set */}
                                            {log.actualSets > 0 && (
                                                <div>
                                                    <label className="text-xs text-gray-400 block mb-2 font-medium">Repeticiones por set</label>
                                                    <div className="flex gap-2 flex-wrap">
                                                        {Array.from({ length: log.actualSets }).map((_, si) => (
                                                            <div key={si} className="flex flex-col items-center gap-1">
                                                                <span className="text-xs text-gray-600">Set {si + 1}</span>
                                                                <input type="number" min={0} max={50}
                                                                    value={log.actualReps[si] ?? 8}
                                                                    onChange={e => updateLog(ex.id, { actualReps: log.actualReps.map((r, i) => i === si ? parseInt(e.target.value) || 0 : r) })}
                                                                    className="w-14 text-center bg-white/5 border border-white/15 rounded-lg py-2 text-white text-sm focus:outline-none focus:border-brand-500" />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* RPE */}
                                            <div>
                                                <label className="text-xs text-gray-400 block mb-2 font-medium">
                                                    RPE Percibido <span className="text-brand-400 font-bold text-sm">{log.rpeActual}/10</span>
                                                    {ex.rpeTarget && <span className="text-gray-600 ml-2">(objetivo: {ex.rpeTarget})</span>}
                                                </label>
                                                <div className="flex gap-1.5">
                                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                                                        <button key={n} type="button" onClick={() => updateLog(ex.id, { rpeActual: n })}
                                                            className={`flex-1 h-9 rounded-lg text-xs font-bold transition-all border ${log.rpeActual === n ? `${rpeColors[n]} border-transparent text-white` : 'bg-white/5 border-white/10 text-gray-500 hover:border-white/20'}`}>
                                                            {n}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Notes + Save */}
                                            <div className="flex gap-3">
                                                <input value={log.notes} onChange={e => updateLog(ex.id, { notes: e.target.value })}
                                                    className="input-field flex-1 text-sm" placeholder="Observaciones (opcional)..." />
                                                <button onClick={() => saveExerciseLog(ex)} disabled={isSaving || isSaved}
                                                    className={`px-5 py-2 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 flex-shrink-0 ${isSaved ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-default' : 'btn-brand'} disabled:opacity-60`}>
                                                    {isSaving ? <Loader2 size={15} className="animate-spin" /> : isSaved ? <CheckCircle size={15} /> : null}
                                                    {isSaved ? 'Guardado' : isSaving ? 'Guardando...' : 'Guardar'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            {saved.size === selectedSession.exercises.length && selectedSession.exercises.length > 0 && (
                                <div className="glass rounded-2xl p-8 text-center border border-emerald-500/30">
                                    <CheckCircle size={40} className="text-emerald-400 mx-auto mb-3" />
                                    <p className="text-xl font-bold text-white">¡Sesión completada! 🎉</p>
                                    <p className="text-gray-400 text-sm mt-2">Todos los ejercicios registrados. Descansa bien para recuperarte.</p>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
