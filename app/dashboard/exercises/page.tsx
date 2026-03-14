import { prisma } from '@/lib/prisma';
import { Dumbbell, Zap, Trophy } from 'lucide-react';
import { ATR_RESIDUAL_EFFECTS } from '@/lib/atr-engine';
import { ATR_PHASE_RULES } from '@/lib/exercise-prescription';

// Exercise type labels and styles
const TYPE_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
    compound: { label: 'Compuesto', color: 'text-blue-300', bg: 'bg-blue-500/15', border: 'border-blue-500/30' },
    olympic: { label: 'Olímpico', color: 'text-amber-300', bg: 'bg-amber-500/15', border: 'border-amber-500/30' },
    ballistic: { label: 'Balístico', color: 'text-orange-300', bg: 'bg-orange-500/15', border: 'border-orange-500/30' },
    plyometric_low: { label: 'Plio. Bajo', color: 'text-yellow-300', bg: 'bg-yellow-500/15', border: 'border-yellow-500/30' },
    plyometric_high: { label: 'Plio. Alto', color: 'text-red-300', bg: 'bg-red-500/15', border: 'border-red-500/30' },
    transfer: { label: 'Transferencia VB', color: 'text-emerald-300', bg: 'bg-emerald-500/15', border: 'border-emerald-500/30' },
    accessory: { label: 'Accesorio', color: 'text-gray-400', bg: 'bg-gray-500/10', border: 'border-gray-500/25' },
};

const IMPACT_CONFIG: Record<string, { label: string; dot: string }> = {
    none: { label: 'Sin impacto', dot: 'bg-emerald-400' },
    low: { label: 'Bajo', dot: 'bg-yellow-400' },
    medium: { label: 'Medio', dot: 'bg-orange-400' },
    high: { label: 'Alto', dot: 'bg-red-500' },
};

const PHASE_CONFIG = {
    accumulation: {
        label: 'Acumulación', emoji: '📦', gradient: 'from-blue-600/20 to-blue-900/10',
        border: 'border-blue-500/30', badge: 'bg-blue-500/15 text-blue-300 border border-blue-500/25',
        icon: Dumbbell,
    },
    transformation: {
        label: 'Transformación', emoji: '⚡', gradient: 'from-amber-600/20 to-amber-900/10',
        border: 'border-amber-500/30', badge: 'bg-amber-500/15 text-amber-300 border border-amber-500/25',
        icon: Zap,
    },
    realization: {
        label: 'Realización', emoji: '🏆', gradient: 'from-emerald-600/20 to-emerald-900/10',
        border: 'border-emerald-500/30', badge: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25',
        icon: Trophy,
    },
};

export default async function ExercisesPage() {
    // Use raw SQL to read ALL columns including new ATR fields
    // (The dev server locks the Prisma DLL, preventing client regeneration)
    const exercises = (await prisma.$queryRawUnsafe(
        'SELECT * FROM "Exercise" ORDER BY name ASC'
    )) as any[];

    // Group by phase (safe parsing with fallbacks)
    const byPhase: Record<string, any[]> = {
        accumulation: [], transformation: [], realization: [],
    };
    const multiPhase: any[] = [];

    for (const ex of exercises) {
        const phases = (() => { try { return JSON.parse(ex.atrPhases || '["accumulation"]') as string[]; } catch { return ['accumulation']; } })();
        if (phases.length > 1) {
            multiPhase.push(ex);
        } else {
            const p = phases[0];
            if (byPhase[p]) byPhase[p].push(ex);
        }
    }

    const phases = ['accumulation', 'transformation', 'realization'] as const;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Dumbbell size={28} className="text-brand-400" /> Catálogo de Ejercicios
                    </h1>
                    <p className="text-gray-400 mt-1">
                        {exercises.length} ejercicios categorizados por fase ATR · Prescripción progresiva basada en la curva fuerza-velocidad
                    </p>
                </div>
            </div>

            {/* Phase Summary Cards */}
            <div className="grid grid-cols-3 gap-4">
                {phases.map(phase => {
                    const cfg = PHASE_CONFIG[phase];
                    const rules = ATR_PHASE_RULES[phase];
                    const residual = ATR_RESIDUAL_EFFECTS[phase];
                    const count = byPhase[phase].length + multiPhase.filter(e => JSON.parse(e.atrPhases).includes(phase)).length;
                    const Icon = cfg.icon;
                    return (
                        <div key={phase} className={`glass rounded-2xl p-5 border ${cfg.border} bg-gradient-to-br ${cfg.gradient} space-y-3`}>
                            <div className="flex items-center gap-2">
                                <Icon size={18} className={cfg.badge.includes('blue') ? 'text-blue-400' : cfg.badge.includes('amber') ? 'text-amber-400' : 'text-emerald-400'} />
                                <span className="font-bold text-white">{cfg.emoji} {cfg.label}</span>
                                <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${cfg.badge}`}>{count} ejercicios</span>
                            </div>
                            <p className="text-xs text-gray-400 leading-relaxed">{rules.primaryFocus}</p>
                            <div className="flex items-center gap-2 text-xs">
                                <span className="text-gray-600">Efecto residual:</span>
                                <span className={`font-semibold ${cfg.badge.includes('blue') ? 'text-blue-300' : cfg.badge.includes('amber') ? 'text-amber-300' : 'text-emerald-300'}`}>
                                    {residual.durationDays.min}–{residual.durationDays.max} días
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 italic line-clamp-2">{rules.prescriptionRationale.slice(0, 120)}...</p>
                        </div>
                    );
                })}
            </div>

            {/* Exercise sections by phase */}
            {phases.map(phase => {
                const cfg = PHASE_CONFIG[phase];
                const phaseExercises = [
                    ...byPhase[phase],
                    ...multiPhase.filter((e: any) => { try { return JSON.parse(e.atrPhases || '[]').includes(phase); } catch { return false; } }),
                ].sort((a, b) => (a.exerciseType ?? '').localeCompare(b.exerciseType ?? '') || a.name.localeCompare(b.name));

                // Group by exerciseType
                const byType: Record<string, typeof exercises> = {};
                for (const ex of phaseExercises) {
                    if (!byType[ex.exerciseType]) byType[ex.exerciseType] = [];
                    byType[ex.exerciseType].push(ex);
                }

                const rules = ATR_PHASE_RULES[phase];

                return (
                    <div key={phase} className="space-y-4">
                        {/* Phase header */}
                        <div className={`flex items-center gap-3 border-b pb-3 ${cfg.border}`}>
                            <h2 className="text-xl font-bold text-white">{cfg.emoji} Fase de {cfg.label}</h2>
                            <span className={`text-xs px-3 py-1 rounded-full ${cfg.badge}`}>{phaseExercises.length} ejercicios</span>
                            <div className={`ml-auto text-xs px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-400`}>
                                Contrastes: {rules.contrastTraining ? '✅ Sí' : '⛔ No'}
                            </div>
                        </div>

                        {/* Prescription rationale banner */}
                        <div className={`rounded-xl border ${cfg.border} bg-gradient-to-br ${cfg.gradient} px-4 py-3`}>
                            <p className="text-xs text-gray-300 leading-relaxed">{rules.prescriptionRationale}</p>
                        </div>

                        {/* Exercises by type */}
                        {Object.entries(byType).map(([type, exList]) => {
                            const typeConf = TYPE_CONFIG[type] ?? TYPE_CONFIG.compound;
                            return (
                                <div key={type}>
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${typeConf.bg} ${typeConf.color} ${typeConf.border}`}>
                                            {typeConf.label}
                                        </span>
                                        <span className="text-gray-600 text-xs">{exList.length}</span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                                        {exList.map(ex => {
                                            const impact = IMPACT_CONFIG[ex.impactLevel] ?? IMPACT_CONFIG.none;
                                            const muscles = JSON.parse(ex.muscleGroups || '[]') as string[];
                                            const exPhases = JSON.parse(ex.atrPhases || '[]') as string[];
                                            return (
                                                <div key={ex.id} className="glass rounded-xl overflow-hidden border border-white/8 hover:border-white/15 transition-all group">
                                                    {/* Image */}
                                                    <div className="h-28 bg-navy-800 flex items-center justify-center relative overflow-hidden">
                                                        {ex.imageUrl ? (
                                                            <img src={ex.imageUrl} alt={ex.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="text-4xl opacity-20">💪</div>
                                                        )}
                                                        {/* Type badge overlay */}
                                                        <div className={`absolute top-2 left-2 text-xs px-2 py-0.5 rounded-full border ${typeConf.bg} ${typeConf.color} ${typeConf.border}`}>
                                                            {typeConf.label}
                                                        </div>
                                                        {/* Sport specific badge */}
                                                        {ex.sportSpecific && (
                                                            <div className="absolute top-2 right-2 text-xs px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30">
                                                                🏐 VB
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="p-3 space-y-2">
                                                        <div>
                                                            <p className="font-semibold text-white text-sm">{ex.name}</p>
                                                            {ex.nameEn && <p className="text-xs text-gray-500">{ex.nameEn}</p>}
                                                        </div>

                                                        {/* Muscles */}
                                                        <div className="flex flex-wrap gap-1">
                                                            {muscles.slice(0, 3).map(m => (
                                                                <span key={m} className="text-xs px-1.5 py-0.5 rounded bg-white/5 text-gray-500 capitalize">
                                                                    {m.replace(/_/g, ' ')}
                                                                </span>
                                                            ))}
                                                        </div>

                                                        {/* Impact + phases */}
                                                        <div className="flex items-center gap-2 pt-1">
                                                            <div className="flex items-center gap-1">
                                                                <div className={`w-2 h-2 rounded-full ${impact.dot}`} />
                                                                <span className="text-xs text-gray-500">{impact.label}</span>
                                                            </div>
                                                            <div className="ml-auto flex gap-1">
                                                                {exPhases.map(p => (
                                                                    <span key={p} className={`text-xs px-1.5 py-0.5 rounded ${PHASE_CONFIG[p as keyof typeof PHASE_CONFIG]?.badge ?? ''}`}>
                                                                        {PHASE_CONFIG[p as keyof typeof PHASE_CONFIG]?.emoji ?? p}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        {/* Contrast pair */}
                                                        {ex.contrastPairName && (
                                                            <div className="text-xs bg-amber-500/8 border border-amber-500/20 rounded-lg px-2 py-1.5">
                                                                <span className="text-amber-400 font-medium">⚡ Contraste → </span>
                                                                <span className="text-amber-200/70">{ex.contrastPairName}</span>
                                                            </div>
                                                        )}

                                                        {/* Description */}
                                                        {ex.description && (
                                                            <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{ex.description}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                );
            })}
        </div>
    );
}
