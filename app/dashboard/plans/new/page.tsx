'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, Save, Loader2, ClipboardList, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';
import {
    classifyAthleteLevel,
    validateATRSequence,
    ATR_RESIDUAL_EFFECTS,
    ATR_PHASE_DEFAULTS,
    type ATRPhase,
} from '@/lib/atr-engine';

interface Athlete {
    id: string;
    fullName: string;
    category: string;
    gender: string;
    bodyWeightKg: number;
    oneRmRecords: string | null;
}

interface MesocycleForm {
    atrPhase: ATRPhase;
    durationWeeks: number;
    primaryGoal: string;
}

const phaseUI = {
    accumulation: {
        label: '📦 Acumulación',
        goal: 'Desarrollo de la fuerza máxima base y base aeróbica',
        color: 'border-blue-500/40 bg-blue-500/8',
        residualColor: 'bg-blue-500/15 border-blue-500/25 text-blue-300',
        barColor: 'bg-blue-500/70',
    },
    transformation: {
        label: '⚡ Transformación',
        goal: 'Conversión de fuerza en potencia explosiva específica',
        color: 'border-amber-500/40 bg-amber-500/8',
        residualColor: 'bg-amber-500/15 border-amber-500/25 text-amber-300',
        barColor: 'bg-amber-500/70',
    },
    realization: {
        label: '🏆 Realización',
        goal: 'Pico de forma. Taper y máxima explosividad pre-competencia',
        color: 'border-emerald-500/40 bg-emerald-500/8',
        residualColor: 'bg-emerald-500/15 border-emerald-500/25 text-emerald-300',
        barColor: 'bg-emerald-500/70',
    },
};

const categoryLabel: Record<string, string> = { U18: 'Sub-18', U19: 'Sub-19', U21: 'Sub-21', adult: 'Adulto' };

export default function NewPlanPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [loadingAthletes, setLoadingAthletes] = useState(true);
    const [athletes, setAthletes] = useState<Athlete[]>([]);
    const [error, setError] = useState('');
    const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null);
    const [showResidualPanel, setShowResidualPanel] = useState(false);

    const [form, setForm] = useState({
        athleteId: '',
        name: '',
        description: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        competitionDate: '',
    });

    const [mesocycles, setMesocycles] = useState<MesocycleForm[]>([
        { atrPhase: 'accumulation', durationWeeks: 4, primaryGoal: phaseUI.accumulation.goal },
        { atrPhase: 'transformation', durationWeeks: 4, primaryGoal: phaseUI.transformation.goal },
        { atrPhase: 'realization', durationWeeks: 2, primaryGoal: phaseUI.realization.goal },
    ]);

    useEffect(() => {
        fetch('/api/athletes')
            .then(r => r.json())
            .then(data => { setAthletes(data); setLoadingAthletes(false); })
            .catch(() => setLoadingAthletes(false));
    }, []);

    // Classify athlete when selected
    const athleteClassification = useMemo(() => {
        if (!selectedAthlete) return null;
        const oneRm = JSON.parse(selectedAthlete.oneRmRecords || '{}');
        return classifyAthleteLevel({
            bodyWeightKg: selectedAthlete.bodyWeightKg,
            oneRmSquat: oneRm.squat || oneRm.sentadilla,
            oneRmDeadlift: oneRm.deadlift || oneRm.peso_muerto,
            category: selectedAthlete.category,
            gender: selectedAthlete.gender,
        });
    }, [selectedAthlete]);

    // Validate ATR block sequence
    const sequenceWarnings = useMemo(() =>
        validateATRSequence(mesocycles.map((m, i) => ({ ...m, orderIndex: i + 1 }))),
        [mesocycles]
    );

    const totalWeeks = mesocycles.reduce((s, m) => s + m.durationWeeks, 0);

    const handleAthleteChange = (id: string) => {
        setForm(f => ({ ...f, athleteId: id }));
        setSelectedAthlete(athletes.find(a => a.id === id) ?? null);
    };

    const addMesocycle = () => {
        const phases: ATRPhase[] = ['accumulation', 'transformation', 'realization'];
        const nextPhase = phases[mesocycles.length % 3];
        setMesocycles(prev => [...prev, { atrPhase: nextPhase, durationWeeks: 3, primaryGoal: phaseUI[nextPhase].goal }]);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const planRes = await fetch('/api/plans', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            if (!planRes.ok) throw new Error('Error al crear el plan');
            const plan = await planRes.json();
            for (let i = 0; i < mesocycles.length; i++) {
                await fetch(`/api/plans/${plan.id}/mesocycles`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...mesocycles[i], orderIndex: i + 1 }),
                });
            }
            router.push(`/dashboard/plans/${plan.id}`);
            router.refresh();
        } catch (err: any) {
            setError(err.message || 'Error inesperado');
        } finally {
            setLoading(false);
        }
    };

    const isBeginnerAlert = athleteClassification?.level === 'beginner';
    const isIntermediateWarning = athleteClassification?.warning && !isBeginnerAlert;

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center gap-3">
                <Link href="/dashboard/plans" className="btn-ghost p-2">
                    <ArrowLeft size={18} />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <ClipboardList size={22} className="text-brand-400" /> Nuevo Plan ATR
                    </h1>
                    <p className="text-gray-400 text-sm mt-0.5">Periodización por Bloques · Issurin (2008)</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                {error && <div className="p-4 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-sm">{error}</div>}

                {/* Plan info */}
                <div className="glass rounded-2xl p-6 space-y-4">
                    <h2 className="text-base font-semibold text-white border-b border-white/8 pb-3">📋 Información del Plan</h2>

                    <div>
                        <label className="block text-sm text-gray-400 mb-1.5 font-medium">Atleta *</label>
                        {loadingAthletes ? (
                            <div className="input-field text-gray-500 flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Cargando...</div>
                        ) : (
                            <select required value={form.athleteId} onChange={e => handleAthleteChange(e.target.value)}
                                className="input-field bg-navy-800">
                                <option value="">-- Seleccionar atleta --</option>
                                {athletes.map(a => (
                                    <option key={a.id} value={a.id}>
                                        {a.fullName} · {categoryLabel[a.category]} {a.gender === 'female' ? '♀' : '♂'}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    {/* ── ATHLETE LEVEL ALERT ── */}
                    {isBeginnerAlert && athleteClassification && (
                        <div className="rounded-2xl border border-orange-500/40 bg-orange-500/10 p-5 space-y-3">
                            <div className="flex items-start gap-3">
                                <AlertTriangle size={22} className="text-orange-400 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-semibold text-orange-300 text-sm">
                                        ⚠️ MODELO ATR NO RECOMENDADO — Atleta Principiante
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">{athleteClassification.criteria}</p>
                                </div>
                            </div>
                            <div className="text-xs text-orange-200/80 leading-relaxed space-y-2 border-t border-orange-500/20 pt-3">
                                <p>El modelo ATR concentra cargas elevadas en bloques cortos. Esta concentración requiere una base de adaptación neuromuscular que los principiantes aún no poseen, lo que puede:</p>
                                <ul className="list-disc list-inside space-y-1 ml-2 text-orange-100/70">
                                    <li>No generar las adaptaciones correctas por falta de base</li>
                                    <li>Aumentar el riesgo de lesión por sobreexposición a cargas altas</li>
                                    <li>Producir acumulación de fatiga sin súper-compensación</li>
                                </ul>
                                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 mt-2">
                                    <p className="text-emerald-300 font-semibold text-xs">✅ RECOMENDACIÓN</p>
                                    <p className="text-emerald-200/80 text-xs mt-1">Aplicar primero un modelo de <strong>periodización lineal</strong> durante 6–12 meses. Los indicadores para escalar a ATR son: Squat ≥ 1.0× peso corporal (♂) / 0.8× (♀) y mínimo 1 año de entrenamiento estructurado.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Category/intermediate warning */}
                    {isIntermediateWarning && (
                        <div className="rounded-xl border border-amber-500/30 bg-amber-500/8 p-4 flex items-start gap-3">
                            <Info size={18} className="text-amber-400 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-amber-200/80 leading-relaxed">{athleteClassification!.warning}</p>
                        </div>
                    )}

                    {athleteClassification?.level === 'advanced' && (
                        <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/8 p-3 flex items-center gap-3">
                            <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
                            <p className="text-xs text-emerald-300">Atleta avanzado — Ideal para el modelo ATR completo.</p>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm text-gray-400 mb-1.5 font-medium">Nombre del plan *</label>
                        <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                            className="input-field" placeholder="Ej: Pretemporada 2025 — U21 Femenino" />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-1.5 font-medium">Descripción</label>
                        <textarea rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                            className="input-field resize-none" placeholder="Objetivo general del plan..." />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm text-gray-400 mb-1.5 font-medium">Fecha inicio *</label>
                            <input required type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} className="input-field" />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1.5 font-medium">Fecha fin</label>
                            <input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} className="input-field" />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1.5 font-medium">🏆 Fecha competencia</label>
                            <input type="date" value={form.competitionDate} onChange={e => setForm(f => ({ ...f, competitionDate: e.target.value }))} className="input-field" />
                        </div>
                    </div>
                </div>

                {/* ATR Block builder */}
                <div className="glass rounded-2xl p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-white/8 pb-3">
                        <div>
                            <h2 className="text-base font-semibold text-white">🔄 Bloques ATR</h2>
                            <p className="text-xs text-gray-500 mt-0.5">
                                Total: <span className="text-brand-400 font-semibold">{totalWeeks} semanas</span>
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <button type="button" onClick={() => setShowResidualPanel(p => !p)}
                                className="btn-ghost text-xs flex items-center gap-1 border border-white/10 rounded-lg px-3 py-1.5 text-blue-400 border-blue-500/20">
                                <Info size={13} /> Efectos residuales
                            </button>
                            <button type="button" onClick={addMesocycle}
                                className="btn-ghost text-xs flex items-center gap-1 border border-white/10 rounded-lg px-3 py-1.5">
                                <Plus size={14} /> Añadir bloque
                            </button>
                        </div>
                    </div>

                    {/* Residual effects panel */}
                    {showResidualPanel && (
                        <div className="rounded-2xl bg-navy-800/60 border border-white/10 p-4 space-y-3">
                            <p className="text-xs font-semibold text-white mb-3 flex items-center gap-2">
                                <Info size={14} className="text-blue-400" />
                                Efectos Residuales de Entrenamiento (Issurin, 2008)
                            </p>
                            {(['accumulation', 'transformation', 'realization'] as ATRPhase[]).map(phase => {
                                const re = ATR_RESIDUAL_EFFECTS[phase];
                                const ui = phaseUI[phase];
                                const defaults = ATR_PHASE_DEFAULTS[phase];
                                return (
                                    <div key={phase} className={`rounded-xl border p-3 space-y-2 ${ui.residualColor}`}>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-semibold">{phaseUI[phase].label}</span>
                                            <span className="text-xs font-bold">
                                                ⏳ {re.durationDays.min}–{re.durationDays.max} días residuales
                                            </span>
                                        </div>
                                        <p className="text-xs opacity-80"><strong>Intensidad:</strong> {defaults.intensityRange.min}–{defaults.intensityRange.max}% 1RM · <strong>Series:</strong> {defaults.volumeSetsRange.min}–{defaults.volumeSetsRange.max} · <strong>Reps:</strong> {defaults.repRange}</p>
                                        <p className="text-xs opacity-70 italic">{re.scientificNote}</p>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Sequence warnings */}
                    {sequenceWarnings.length > 0 && (
                        <div className="space-y-2">
                            {sequenceWarnings.map((w, i) => (
                                <div key={i} className="rounded-xl border border-amber-500/30 bg-amber-500/8 px-4 py-2.5 flex items-start gap-2">
                                    <AlertTriangle size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
                                    <p className="text-xs text-amber-200/80">{w}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Visual ATR timeline */}
                    <div className="flex gap-1 h-3 rounded-full overflow-hidden">
                        {mesocycles.map((m, i) => (
                            <div key={i}
                                style={{ flex: m.durationWeeks }}
                                className={`transition-all ${phaseUI[m.atrPhase].barColor}`}
                            />
                        ))}
                    </div>
                    <div className="flex gap-1 justify-between px-0.5">
                        {mesocycles.map((m, i) => (
                            <p key={i} style={{ flex: m.durationWeeks }} className="text-center text-xs text-gray-600">{m.durationWeeks}w</p>
                        ))}
                    </div>

                    {/* Mesocycle blocks */}
                    <div className="space-y-3">
                        {mesocycles.map((meso, idx) => {
                            const info = phaseUI[meso.atrPhase];
                            const defaults = ATR_PHASE_DEFAULTS[meso.atrPhase];
                            const re = ATR_RESIDUAL_EFFECTS[meso.atrPhase];
                            return (
                                <div key={idx} className={`rounded-2xl p-4 border ${info.color} space-y-3 transition-all`}>
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-semibold text-white">Bloque {idx + 1}</span>
                                        <select value={meso.atrPhase}
                                            onChange={e => setMesocycles(prev => prev.map((m, i) => i === idx ? { ...m, atrPhase: e.target.value as ATRPhase, primaryGoal: phaseUI[e.target.value as ATRPhase].goal } : m))}
                                            className="text-xs bg-white/5 border border-white/15 rounded-lg px-2 py-1.5 text-white focus:outline-none focus:border-brand-500">
                                            <option value="accumulation">📦 Acumulación</option>
                                            <option value="transformation">⚡ Transformación</option>
                                            <option value="realization">🏆 Realización</option>
                                        </select>
                                        {/* Intensity/volume badges */}
                                        <span className="text-xs px-2 py-1 rounded-lg bg-white/5 text-gray-400 border border-white/10">
                                            {defaults.intensityRange.min}–{defaults.intensityRange.max}% 1RM
                                        </span>
                                        <span className="text-xs px-2 py-1 rounded-lg bg-white/5 text-gray-400 border border-white/10">
                                            {defaults.volumeSetsRange.min}–{defaults.volumeSetsRange.max} series
                                        </span>
                                        <div className="ml-auto flex items-center gap-3">
                                            <label className="text-xs text-gray-400">Semanas:</label>
                                            <input type="number" min={1} max={8} value={meso.durationWeeks}
                                                onChange={e => setMesocycles(prev => prev.map((m, i) => i === idx ? { ...m, durationWeeks: parseInt(e.target.value) || 1 } : m))}
                                                className="w-16 text-center bg-white/5 border border-white/15 rounded-lg px-2 py-1.5 text-white text-sm focus:outline-none focus:border-brand-500" />
                                            {mesocycles.length > 1 && (
                                                <button type="button" onClick={() => setMesocycles(prev => prev.filter((_, i) => i !== idx))}
                                                    className="text-gray-500 hover:text-red-400 transition-colors p-1">
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Residual effect inline */}
                                    <div className="text-xs text-gray-500 flex items-center gap-2">
                                        <span>⏳ Efecto residual:</span>
                                        <span className="font-medium text-gray-300">{re.durationDays.min}–{re.durationDays.max} días</span>
                                        <span>·</span>
                                        <span>{re.primaryAdaptation}</span>
                                    </div>

                                    <div>
                                        <label className="text-xs text-gray-400 mb-1 block">Objetivo principal</label>
                                        <input value={meso.primaryGoal}
                                            onChange={e => setMesocycles(prev => prev.map((m, i) => i === idx ? { ...m, primaryGoal: e.target.value } : m))}
                                            className="w-full bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500 placeholder:text-gray-600"
                                            placeholder="Objetivo del bloque..." />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <button id="btn-create-plan" type="submit" disabled={loading}
                    className="btn-brand w-full flex items-center justify-center gap-2 py-3 text-base disabled:opacity-60">
                    {loading ? <><Loader2 size={18} className="animate-spin" /> Creando plan...</> : <><Save size={18} /> Crear Plan ATR</>}
                </button>
            </form>
        </div>
    );
}
