'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowLeft, Plus, Trash2, Save, Loader2, GripVertical,
    ChevronUp, ChevronDown, Dumbbell, Edit2, Check, X, Download
} from 'lucide-react';

interface Exercise {
    id: string;
    name: string;
    nameEn?: string;
    exerciseType?: string;
    impactLevel?: string;
    muscleGroups?: string;
    imageUrl?: string;
}

interface SessionExercise {
    id: string;
    orderIndex: number;
    sets: number;
    repsScheme: string;
    intensityPctRm: number | null;
    loadKg: number | null;
    restSeconds: number;
    tempo: string | null;
    rpeTarget: number | null;
    notes: string | null;
    isContrast: boolean;
    exercise: Exercise;
}

interface SessionDetail {
    id: string;
    weekNumber: number;
    dayOfWeek: string;
    sessionType: string;
    estimatedDurationMin: number;
    notes: string | null;
    mesocycle: {
        atrPhase: string;
        plan: {
            id: string;
            name: string;
            athlete: { fullName: string };
        };
    };
    exercises: SessionExercise[];
}

const DAY_LABELS: Record<string, string> = {
    monday: 'Lunes', tuesday: 'Martes', wednesday: 'Miércoles',
    thursday: 'Jueves', friday: 'Viernes', saturday: 'Sábado', sunday: 'Domingo',
};

const PHASE_COLORS: Record<string, string> = {
    accumulation: 'text-blue-400 border-blue-500/30 bg-blue-500/10',
    transformation: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
    realization: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
};

const PHASE_LABELS: Record<string, string> = {
    accumulation: '📦 Acumulación',
    transformation: '⚡ Transformación',
    realization: '🏆 Realización',
};

const TYPE_BADGE: Record<string, string> = {
    compound: 'bg-blue-500/15 text-blue-300',
    olympic: 'bg-amber-500/15 text-amber-300',
    ballistic: 'bg-orange-500/15 text-orange-300',
    plyometric_low: 'bg-yellow-500/15 text-yellow-300',
    plyometric_high: 'bg-red-500/15 text-red-300',
    transfer: 'bg-emerald-500/15 text-emerald-300',
    accessory: 'bg-gray-500/15 text-gray-400',
};

export default function SessionEditPage() {
    const params = useParams();
    const router = useRouter();
    const sessionId = params.id as string;

    const [session, setSession] = useState<SessionDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null); // exId being saved
    const [showAddExercise, setShowAddExercise] = useState(false);
    const [availableExercises, setAvailableExercises] = useState<Exercise[]>([]);
    const [searchEx, setSearchEx] = useState('');
    const [editingExId, setEditingExId] = useState<string | null>(null);
    const [editValues, setEditValues] = useState<Partial<SessionExercise>>({});
    const [deleting, setDeleting] = useState<string | null>(null);

    const fetchSession = useCallback(async () => {
        const res = await fetch(`/api/sessions/${sessionId}`);
        const data = await res.json();
        setSession(data);
        setLoading(false);
    }, [sessionId]);

    useEffect(() => {
        fetchSession();
        fetch('/api/exercises')
            .then(r => r.json())
            .then(setAvailableExercises)
            .catch(console.error);
    }, [fetchSession]);

    const handleAddExercise = async (exerciseId: string) => {
        setSaving('adding');
        const atrPhase = session?.mesocycle.atrPhase ?? 'accumulation';
        // Get default params based on ATR phase
        const defaults: Record<string, any> = {
            accumulation: { sets: 4, repsScheme: '4x6-10', intensityPctRm: 75, tempo: '3-1-1-0', restSeconds: 120, rpeTarget: 7 },
            transformation: { sets: 4, repsScheme: '4x4-6', intensityPctRm: 82, tempo: '2-0-1-0', restSeconds: 150, rpeTarget: 8 },
            realization: { sets: 3, repsScheme: '3x2-4', intensityPctRm: 90, tempo: '1-0-X-0', restSeconds: 180, rpeTarget: 9 },
        };
        const d = defaults[atrPhase] ?? defaults.accumulation;

        await fetch(`/api/sessions/${sessionId}/exercises`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ exerciseId, ...d }),
        });

        setSaving(null);
        setShowAddExercise(false);
        setSearchEx('');
        fetchSession();
    };

    const handleDelete = async (exId: string) => {
        setDeleting(exId);
        await fetch(`/api/session-exercises/${exId}`, { method: 'DELETE' });
        setDeleting(null);
        fetchSession();
    };

    const startEdit = (ex: SessionExercise) => {
        setEditingExId(ex.id);
        setEditValues({
            sets: ex.sets,
            repsScheme: ex.repsScheme,
            intensityPctRm: ex.intensityPctRm,
            loadKg: ex.loadKg,
            restSeconds: ex.restSeconds,
            tempo: ex.tempo ?? '',
            rpeTarget: ex.rpeTarget,
            notes: ex.notes ?? '',
        });
    };

    const saveEdit = async (exId: string) => {
        setSaving(exId);
        await fetch(`/api/session-exercises/${exId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(editValues),
        });
        setEditingExId(null);
        setSaving(null);
        fetchSession();
    };

    const moveExercise = async (exId: string, direction: 'up' | 'down') => {
        if (!session) return;
        const exes = [...session.exercises];
        const idx = exes.findIndex(e => e.id === exId);
        if (direction === 'up' && idx === 0) return;
        if (direction === 'down' && idx === exes.length - 1) return;

        const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
        await Promise.all([
            fetch(`/api/session-exercises/${exes[idx].id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderIndex: swapIdx + 1 }),
            }),
            fetch(`/api/session-exercises/${exes[swapIdx].id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderIndex: idx + 1 }),
            }),
        ]);
        fetchSession();
    };

    const filteredExercises = availableExercises.filter(e =>
        e.name.toLowerCase().includes(searchEx.toLowerCase()) ||
        (e.nameEn ?? '').toLowerCase().includes(searchEx.toLowerCase())
    );

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <Loader2 size={28} className="animate-spin text-brand-400" />
        </div>
    );
    if (!session) return <div className="text-red-400 p-8">Sesión no encontrada</div>;

    const phaseColor = PHASE_COLORS[session.mesocycle.atrPhase] ?? '';
    const phaseLabel = PHASE_LABELS[session.mesocycle.atrPhase] ?? session.mesocycle.atrPhase;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Link href={`/dashboard/plans/${session.mesocycle.plan.id}`} className="btn-ghost p-2">
                    <ArrowLeft size={18} />
                </Link>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Edit2 size={20} className="text-brand-400" />
                        Editor de Rutina
                    </h1>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-gray-400 text-sm">{session.mesocycle.plan.name}</span>
                        <span className="text-gray-600">·</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${phaseColor}`}>{phaseLabel}</span>
                        <span className="text-gray-600">·</span>
                        <span className="text-gray-400 text-sm">
                            Semana {session.weekNumber} — {DAY_LABELS[session.dayOfWeek] ?? session.dayOfWeek}
                        </span>
                        <span className="text-gray-600">·</span>
                        <span className="text-gray-500 text-sm">{session.mesocycle.plan.athlete.fullName}</span>
                    </div>
                </div>
                <a
                    href={`/dashboard/sessions/${sessionId}/pdf`}
                    className="btn-ghost border border-white/10 text-xs px-3 py-2 flex items-center gap-1.5 rounded-xl"
                >
                    <Download size={14} /> PDF
                </a>
            </div>

            {/* Exercise List */}
            <div className="glass rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
                    <div>
                        <h2 className="font-semibold text-white flex items-center gap-2">
                            <Dumbbell size={16} className="text-brand-400" />
                            Ejercicios ({session.exercises.length})
                        </h2>
                        <p className="text-xs text-gray-500 mt-0.5">Arrastra o usa ↑↓ para reordenar</p>
                    </div>
                    <button
                        onClick={() => setShowAddExercise(s => !s)}
                        className="btn-brand text-sm flex items-center gap-1.5 px-4 py-2"
                    >
                        <Plus size={15} /> Agregar ejercicio
                    </button>
                </div>

                {/* Add exercise panel */}
                {showAddExercise && (
                    <div className="px-6 py-4 border-b border-white/8 bg-white/2 space-y-3">
                        <input
                            autoFocus
                            value={searchEx}
                            onChange={e => setSearchEx(e.target.value)}
                            placeholder="Buscar ejercicio..."
                            className="input-field text-sm w-full"
                        />
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                            {filteredExercises.slice(0, 30).map(ex => {
                                const typeClass = TYPE_BADGE[(ex as any).exerciseType ?? 'compound'] ?? TYPE_BADGE.compound;
                                return (
                                    <button
                                        key={ex.id}
                                        onClick={() => handleAddExercise(ex.id)}
                                        disabled={saving === 'adding'}
                                        className="text-left p-2.5 rounded-xl border border-white/10 hover:border-brand-500/50 hover:bg-brand-500/5 transition-all space-y-1"
                                    >
                                        <p className="text-xs font-medium text-white line-clamp-1">{ex.name}</p>
                                        <span className={`text-xs px-1.5 py-0.5 rounded ${typeClass}`}>
                                            {(ex as any).exerciseType ?? 'compound'}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                        <button onClick={() => setShowAddExercise(false)} className="text-xs text-gray-500 hover:text-gray-300">
                            Cancelar
                        </button>
                    </div>
                )}

                {/* Exercises */}
                {session.exercises.length === 0 ? (
                    <div className="text-center py-16 text-gray-500">
                        <Dumbbell size={32} className="mx-auto mb-3 opacity-30" />
                        <p className="text-sm">No hay ejercicios. Agrega el primero.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-white/5">
                        {session.exercises.map((ex, idx) => {
                            const isEditing = editingExId === ex.id;
                            const isDeleting = deleting === ex.id;
                            const isSaving = saving === ex.id;
                            const typeClass = TYPE_BADGE[ex.exercise.exerciseType ?? 'compound'] ?? TYPE_BADGE.compound;

                            return (
                                <div key={ex.id} className={`px-6 py-4 transition-all ${isEditing ? 'bg-brand-500/5' : 'hover:bg-white/2'}`}>
                                    {/* Row header */}
                                    <div className="flex items-center gap-3">
                                        {/* Order arrows */}
                                        <div className="flex flex-col gap-0.5 text-gray-600">
                                            <button onClick={() => moveExercise(ex.id, 'up')} disabled={idx === 0}
                                                className="hover:text-white disabled:opacity-20 transition-colors p-0.5">
                                                <ChevronUp size={14} />
                                            </button>
                                            <button onClick={() => moveExercise(ex.id, 'down')} disabled={idx === session.exercises.length - 1}
                                                className="hover:text-white disabled:opacity-20 transition-colors p-0.5">
                                                <ChevronDown size={14} />
                                            </button>
                                        </div>

                                        {/* Number */}
                                        <span className="w-6 h-6 rounded-lg bg-white/8 text-xs text-gray-400 flex items-center justify-center font-bold flex-shrink-0">
                                            {ex.orderIndex}
                                        </span>

                                        {/* Exercise image */}
                                        {ex.exercise.imageUrl && (
                                            <img src={ex.exercise.imageUrl} alt={ex.exercise.name}
                                                className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                                        )}

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="font-semibold text-white text-sm">{ex.exercise.name}</p>
                                                <span className={`text-xs px-1.5 py-0.5 rounded ${typeClass}`}>
                                                    {ex.exercise.exerciseType ?? 'compound'}
                                                </span>
                                                {ex.isContrast && (
                                                    <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300">
                                                        ⚡ Contraste
                                                    </span>
                                                )}
                                            </div>
                                            {!isEditing && (
                                                <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                                                    <span className="text-xs text-gray-400">{ex.sets} × {ex.repsScheme}</span>
                                                    {ex.intensityPctRm && <span className="text-xs text-gray-500">{ex.intensityPctRm}% 1RM</span>}
                                                    {ex.loadKg && <span className="text-xs text-brand-400">{ex.loadKg}kg</span>}
                                                    {ex.tempo && <span className="text-xs text-gray-500">Tempo: {ex.tempo}</span>}
                                                    <span className="text-xs text-gray-500">{ex.restSeconds}s descanso</span>
                                                    {ex.rpeTarget && <span className="text-xs text-gray-500">RPE {ex.rpeTarget}</span>}
                                                </div>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-1.5 flex-shrink-0">
                                            {isEditing ? (
                                                <>
                                                    <button onClick={() => saveEdit(ex.id)} disabled={isSaving}
                                                        className="p-2 rounded-lg bg-brand-500/20 text-brand-400 hover:bg-brand-500/30 transition-all">
                                                        {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                                                    </button>
                                                    <button onClick={() => setEditingExId(null)}
                                                        className="p-2 rounded-lg bg-white/8 text-gray-400 hover:bg-white/15 transition-all">
                                                        <X size={14} />
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button onClick={() => startEdit(ex)}
                                                        className="p-2 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-all">
                                                        <Edit2 size={14} />
                                                    </button>
                                                    <button onClick={() => handleDelete(ex.id)} disabled={isDeleting}
                                                        className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all">
                                                        {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Edit form */}
                                    {isEditing && (
                                        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                                            <div>
                                                <label className="text-xs text-gray-500 mb-1 block">Series</label>
                                                <input type="number" min={1} max={10}
                                                    value={editValues.sets ?? 3}
                                                    onChange={e => setEditValues(v => ({ ...v, sets: parseInt(e.target.value) }))}
                                                    className="input-field text-sm py-1.5" />
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-500 mb-1 block">Reps / Esquema</label>
                                                <input
                                                    value={editValues.repsScheme ?? ''}
                                                    onChange={e => setEditValues(v => ({ ...v, repsScheme: e.target.value }))}
                                                    className="input-field text-sm py-1.5" placeholder="ej: 4x6" />
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-500 mb-1 block">% 1RM</label>
                                                <input type="number" min={0} max={100} step={0.5}
                                                    value={editValues.intensityPctRm ?? ''}
                                                    onChange={e => setEditValues(v => ({ ...v, intensityPctRm: parseFloat(e.target.value) || null }))}
                                                    className="input-field text-sm py-1.5" placeholder="75" />
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-500 mb-1 block">Carga (kg)</label>
                                                <input type="number" min={0} step={2.5}
                                                    value={editValues.loadKg ?? ''}
                                                    onChange={e => setEditValues(v => ({ ...v, loadKg: parseFloat(e.target.value) || null }))}
                                                    className="input-field text-sm py-1.5" placeholder="Auto" />
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-500 mb-1 block">Descanso (seg)</label>
                                                <input type="number" min={30} max={600} step={15}
                                                    value={editValues.restSeconds ?? 120}
                                                    onChange={e => setEditValues(v => ({ ...v, restSeconds: parseInt(e.target.value) }))}
                                                    className="input-field text-sm py-1.5" />
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-500 mb-1 block">Tempo</label>
                                                <input
                                                    value={(editValues as any).tempo ?? ''}
                                                    onChange={e => setEditValues(v => ({ ...v, tempo: e.target.value }))}
                                                    className="input-field text-sm py-1.5" placeholder="3-1-1-0" />
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-500 mb-1 block">RPE objetivo</label>
                                                <input type="number" min={1} max={10}
                                                    value={editValues.rpeTarget ?? ''}
                                                    onChange={e => setEditValues(v => ({ ...v, rpeTarget: parseInt(e.target.value) || null }))}
                                                    className="input-field text-sm py-1.5" placeholder="7" />
                                            </div>
                                            <div className="col-span-2 md:col-span-4">
                                                <label className="text-xs text-gray-500 mb-1 block">Notas del entrenador</label>
                                                <input
                                                    value={(editValues as any).notes ?? ''}
                                                    onChange={e => setEditValues(v => ({ ...v, notes: e.target.value }))}
                                                    className="input-field text-sm py-1.5 w-full"
                                                    placeholder="Indicaciones técnicas para el atleta..." />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Session summary footer */}
            <div className="glass rounded-xl px-6 py-4 flex items-center gap-6 flex-wrap">
                <div className="text-center">
                    <p className="text-2xl font-bold text-white">{session.exercises.length}</p>
                    <p className="text-xs text-gray-500">Ejercicios</p>
                </div>
                <div className="text-center">
                    <p className="text-2xl font-bold text-brand-400">
                        {session.exercises.reduce((s, e) => s + e.sets, 0)}
                    </p>
                    <p className="text-xs text-gray-500">Series totales</p>
                </div>
                <div className="text-center">
                    <p className="text-2xl font-bold text-white">{session.estimatedDurationMin}'</p>
                    <p className="text-xs text-gray-500">Duración est.</p>
                </div>
                <div className="ml-auto">
                    <Link href={`/dashboard/plans/${session.mesocycle.plan.id}`}
                        className="btn-ghost border border-white/10 rounded-xl px-4 py-2 text-sm flex items-center gap-2">
                        <ArrowLeft size={14} /> Volver al plan
                    </Link>
                </div>
            </div>
        </div>
    );
}
