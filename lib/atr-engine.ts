/**
 * ATR Periodization Engine — Scientific Model
 * ─────────────────────────────────────────────────────────────────────────────
 * Based on: Issurin, V.B. (2008). Block periodization versus traditional training
 * theory: A review. Journal of Sports Medicine & Physical Fitness, 48(1), 65-75.
 *
 * This engine implements the ATR (Accumulation → Transformation → Realization)
 * block periodization model for beach volleyball strength and conditioning.
 *
 * IMPORTANT: The ATR model concentrates training stimuli in sequential blocks
 * targeting one dominant biomotor ability at a time. This is ONLY appropriate
 * for INTERMEDIATE/ADVANCED athletes (≥1 year structured training).
 * Beginners should use a traditional/linear model first.
 */

export type ATRPhase = 'accumulation' | 'transformation' | 'realization';
export type AthleteLevel = 'beginner' | 'intermediate' | 'advanced';

// ─────────────────────────────────────────────────────────────────────────────
// Residual Training Effects (Issurin, 2008)
// ─────────────────────────────────────────────────────────────────────────────
export interface ResidualEffect {
    /** Days the training effect is retained after the block ends */
    durationDays: { min: number; max: number };
    primaryAdaptation: string;
    keyQuality: string;
    scientificNote: string;
}

export const ATR_RESIDUAL_EFFECTS: Record<ATRPhase, ResidualEffect> = {
    accumulation: {
        durationDays: { min: 25, max: 35 },
        primaryAdaptation: 'Hipertrofia, resistencia aeróbica y base de fuerza máxima',
        keyQuality: 'Fuerza máxima general',
        scientificNote:
            'El efecto residual largo (~30 días) de la fase de Acumulación permite que el bloque de Transformación aproveche la máxima hipertrofia y base de fuerza antes de su declinación. Por eso ATR utiliza bloques consecutivos, no paralelos.',
    },
    transformation: {
        durationDays: { min: 15, max: 20 },
        primaryAdaptation: 'Fuerza relativa, potencia y tolerancia a la fatiga neuromuscular',
        keyQuality: 'Fuerza específica / Potencia',
        scientificNote:
            'El efecto residual más corto (15-20 días) de Transformación determina que la fase de Realización deba seguir inmediatamente para aprovechar el pico neuromuscular antes de que declina. De no hacerlo, se pierde el taper efectivo.',
    },
    realization: {
        durationDays: { min: 5, max: 10 },
        primaryAdaptation: 'Explosividad máxima, velocidad de contracción y pico de forma competitiva',
        keyQuality: 'Explosividad / Velocidad de fuerza',
        scientificNote:
            'La fase de Realización tiene el efecto residual más corto. El taper (reducción de volumen 40-60%, mantenimiento de intensidad) maximiza la super-compensación justo antes de la competencia. Una Realización >2 semanas en competencia puede generar desentrenamiento.',
    },
};

// ─────────────────────────────────────────────────────────────────────────────
// Phase Defaults — Scientific parameters for each ATR block
// ─────────────────────────────────────────────────────────────────────────────
export interface ATRDefaults {
    intensityRange: { min: number; max: number };
    volumeSetsRange: { min: number; max: number };
    repRange: string;
    tempoDefault: string;
    rpeTarget: number;
    description: string;
    sessionFrequency: { min: number; max: number }; // sessions/week
    dominantExerciseTypes: string[];
    taperProtocol?: string; // only for realization
}

export const ATR_PHASE_DEFAULTS: Record<ATRPhase, ATRDefaults> = {
    accumulation: {
        intensityRange: { min: 65, max: 75 },
        volumeSetsRange: { min: 4, max: 6 },
        repRange: '6-10',
        tempoDefault: '3-1-1-0',
        rpeTarget: 7,
        sessionFrequency: { min: 3, max: 4 },
        description:
            'Volumen ALTO, intensidad MODERADA (65–75% 1RM). Énfasis en hipertrofia funcional, base aeróbica y técnica de los movimientos fundamentales (sentadilla, peso muerto, empuje vertical/horizontal). El efecto residual de esta fase dura ~30 días.',
        dominantExerciseTypes: [
            'Sentadilla con Barra',
            'Peso Muerto Rumano',
            'Press Militar',
            'Remo con Barra',
            'Hip Thrust con Barra',
            'Sentadilla Búlgara',
        ],
    },
    transformation: {
        intensityRange: { min: 78, max: 88 },
        volumeSetsRange: { min: 3, max: 4 },
        repRange: '3-6',
        tempoDefault: '2-0-1-0',
        rpeTarget: 8,
        sessionFrequency: { min: 3, max: 4 },
        description:
            'Volumen MEDIO, intensidad ALTA (78–88% 1RM). Conversión de la fuerza base en potencia específica para voleibol. Énfasis en velocidad de ejecución máxima, levantamientos olímpicos y saltos lastrados. El efecto residual dura 15-20 días.',
        dominantExerciseTypes: [
            'Colgada de Potencia (Hang Clean)',
            'Cargada de Potencia (Power Clean)',
            'Salto con Peso',
            'Swing con Kettlebell',
            'Box Jump Lastrado',
        ],
    },
    realization: {
        intensityRange: { min: 88, max: 95 },
        volumeSetsRange: { min: 2, max: 3 },
        repRange: '1-4',
        tempoDefault: '1-0-X-0',
        rpeTarget: 9,
        sessionFrequency: { min: 2, max: 3 },
        description:
            'Volumen BAJO (−40 a −60% vs. Transformación), intensidad MUY ALTA (88–95% 1RM). Puesta a punto pre-competencia. Volumen mínimo para no acumular fatiga. El efecto residual es solo 5-10 días, por lo que debe coincidir precisamente con la fecha de competencia.',
        dominantExerciseTypes: [
            'Sentadilla con Barra (heavy singles/doubles)',
            'Salto Vertical con Contramovement (CMJ)',
            'Arranque de Fuerza (Snatch Pull)',
            'Drop Jump / Reactive Jumps',
        ],
        taperProtocol:
            'Reducir volumen 40-60% de Transformación. Mantener o aumentar intensidad. Conservar frecuencia de sesiones (no reducir más de 1/semana). Eliminar ejercicios accesorios. Priorizar calidad sobre cantidad.',
    },
};

// ─────────────────────────────────────────────────────────────────────────────
// Category safety caps (max %RM by age category — CONMEBOL/CSV guidelines)
// ─────────────────────────────────────────────────────────────────────────────
export const CATEGORY_MAX_INTENSITY: Record<string, number> = {
    U18: 82,   // Skeletal maturity not complete; avoid max loads
    U19: 86,
    U21: 92,
    adult: 97,
};

export const CATEGORY_NOTES: Record<string, string> = {
    U18: 'Sub-18: Límite de seguridad 82% 1RM. La madurez esquelética puede no estar completa. Priorizar técnica y volumen ante intensidad.',
    U19: 'Sub-19: Límite 86% 1RM. Permitir progresión gradual a cargas altas supervisadas.',
    U21: 'Sub-21: Límite 92% 1RM. Atletas en desarrollo avanzado, pueden ejecutar el modelo ATR completo.',
    adult: 'Adulto: Límite 97% 1RM. Atletas con experiencia de entrenamiento. Pueden ejecutar todo el rango del modelo ATR.',
};

// ─────────────────────────────────────────────────────────────────────────────
// Athlete Level Classification
// ─────────────────────────────────────────────────────────────────────────────
export interface LevelClassification {
    level: AthleteLevel;
    label: string;
    modelRecommendation: 'ATR' | 'traditional_linear' | 'undulating';
    warning?: string;
    criteria: string;
}

/**
 * Classify athlete level based on training experience and 1RM strength standards
 * for beach volleyball (relative strength benchmarks).
 *
 * Strength standards based on Comfort, P., McMahon, J., & Newton, R. (2012).
 * Relative strength as a predictor of jump performance in elite athletes.
 */
export function classifyAthleteLevel(params: {
    trainingYears?: number;
    bodyWeightKg: number;
    oneRmSquat?: number;
    oneRmDeadlift?: number;
    category: string;
    gender: string;
}): LevelClassification {
    const { trainingYears, bodyWeightKg, oneRmSquat, oneRmDeadlift, category, gender } = params;

    // Relative strength ratios (squat:bodyweight)
    const squatRatio = oneRmSquat ? oneRmSquat / bodyWeightKg : null;
    const deadliftRatio = oneRmDeadlift ? oneRmDeadlift / bodyWeightKg : null;

    // Gender-adjusted thresholds
    const isFemale = gender === 'female';
    const beginnerSquatThreshold = isFemale ? 0.8 : 1.0;    // x bodyweight
    const intermediateSquatThreshold = isFemale ? 1.2 : 1.5;

    // U18 athletes — always consider experience carefully
    const isYouth = category === 'U18' || category === 'U19';

    // ── Beginner detection ──
    const isBeginnerByYears = trainingYears !== undefined && trainingYears < 1;
    const isBeginnerByStrength = squatRatio !== null && squatRatio < beginnerSquatThreshold;
    const isBeginnerByDeadlift = deadliftRatio !== null && deadliftRatio < (isFemale ? 0.9 : 1.1);

    if (isBeginnerByYears || (isBeginnerByStrength && trainingYears === undefined)) {
        return {
            level: 'beginner',
            label: 'Principiante',
            modelRecommendation: 'traditional_linear',
            criteria: trainingYears !== undefined
                ? `${trainingYears} año(s) de entrenamiento estructurado`
                : `Ratio de fuerza squat: ${squatRatio?.toFixed(2) ?? 'N/D'} × peso corporal`,
            warning:
                '⚠️ MODELO ATR NO RECOMENDADO para este nivel. El modelo ATR concentra cargas altas en bloques cortos que requieren una base de adaptación neuromuscular completa. Para principiantes, esta concentración de carga no generará las adaptaciones correctas y puede elevar el riesgo de lesión.\n\n✅ RECOMENDACIÓN: Aplicar primero un modelo de periodización lineal o lineal ondulado (DUP) durante 6-12 meses para construir la base. Los indicadores para escalar a ATR son: squat ≥ 1.0× peso corporal (♂) / 0.8× (♀), y al menos 1 año de entrenamiento estructurado.',
        };
    }

    // ── Intermediate detection ──
    const isIntermediateByYears = trainingYears !== undefined && trainingYears >= 1 && trainingYears < 3;
    const isIntermediateByStrength = squatRatio !== null && squatRatio >= beginnerSquatThreshold && squatRatio < intermediateSquatThreshold;

    if (isIntermediateByYears || isIntermediateByStrength) {
        return {
            level: 'intermediate',
            label: 'Intermedio',
            modelRecommendation: 'ATR',
            criteria: trainingYears !== undefined
                ? `${trainingYears} año(s) de entrenamiento`
                : `Ratio squat: ${squatRatio?.toFixed(2)}× PC`,
            warning: isYouth
                ? `⚠️ Categoría ${category}: Aplicar el modelo ATR con supervisión cercana. Respetar los límites de intensidad por categoría (máx. ${CATEGORY_MAX_INTENSITY[category]}% 1RM). Dar prioridad a la técnica en la fase de Acumulación.`
                : undefined,
        };
    }

    // ── Advanced ──
    return {
        level: 'advanced',
        label: 'Avanzado',
        modelRecommendation: 'ATR',
        criteria: trainingYears !== undefined
            ? `${trainingYears}+ años de entrenamiento`
            : `Ratio squat: ${squatRatio?.toFixed(2)}× PC`,
    };
}

/**
 * Validate ATR block sequence and durations
 * Returns warnings if the block structure is suboptimal
 */
export function validateATRSequence(mesocycles: Array<{
    atrPhase: ATRPhase;
    durationWeeks: number;
    orderIndex: number;
}>): string[] {
    const warnings: string[] = [];
    const sorted = [...mesocycles].sort((a, b) => a.orderIndex - b.orderIndex);

    // Check classic ATR order
    const phases = sorted.map(m => m.atrPhase);
    const classicOrder = ['accumulation', 'transformation', 'realization'];
    const hasClassicEnd = phases.slice(-3).join(',') === classicOrder.join(',');
    if (sorted.length >= 3 && !hasClassicEnd) {
        warnings.push('⚠️ La secuencia de fases no sigue el orden ATR clásico (Acumulación → Transformación → Realización). El efecto residual puede no aprovecharse correctamente.');
    }

    // Check durations
    for (const m of sorted) {
        if (m.atrPhase === 'accumulation' && m.durationWeeks < 3) {
            warnings.push(`⚠️ Acumulación de ${m.durationWeeks} semana(s) es muy corta. Mínimo recomendado: 3-4 semanas para generar adaptaciones hipertróficas y de fuerza base.`);
        }
        if (m.atrPhase === 'transformation' && m.durationWeeks < 2) {
            warnings.push(`⚠️ Transformación de ${m.durationWeeks} semana(s) es muy corta. Mínimo recomendado: 2-3 semanas para la conversión fuerza→potencia.`);
        }
        if (m.atrPhase === 'realization' && m.durationWeeks > 3) {
            warnings.push(`⚠️ Realización de ${m.durationWeeks} semanas es demasiado larga. El efecto residual de esta fase solo dura 5-10 días. Una Realización >3 semanas puede resultar en desentrenamiento antes de la competencia.`);
        }
        if (m.atrPhase === 'accumulation' && m.durationWeeks > 8) {
            warnings.push(`⚠️ Acumulación de ${m.durationWeeks} semanas puede ser excesiva. El efecto residual (~30 días) comenzará a decaer si la Transformación no inicia pronto.`);
        }
    }

    // Gap between Transformation and competition
    const realizationIdx = sorted.findLastIndex(m => m.atrPhase === 'realization');
    const transformIdx = sorted.findLastIndex(m => m.atrPhase === 'transformation');
    if (realizationIdx > -1 && transformIdx > -1 && realizationIdx - transformIdx > 1) {
        warnings.push('⚠️ Hay bloques entre Transformación y Realización. El efecto residual de Transformación (15-20 días) podría perderse antes de que comience la Realización.');
    }

    return warnings;
}

// ─────────────────────────────────────────────────────────────────────────────
// Load Calculations
// ─────────────────────────────────────────────────────────────────────────────

/** Calculate load in kg from 1RM and intensity percentage (Epley formula rounding) */
export function calculateLoadKg(oneRm: number, intensityPct: number): number {
    return Math.round((oneRm * (intensityPct / 100)) / 2.5) * 2.5; // round to nearest 2.5kg
}

/** Get ATR phase defaults for a given phase */
export function getATRDefaults(phase: ATRPhase): ATRDefaults {
    return ATR_PHASE_DEFAULTS[phase];
}

/** Check if intensity is safe for athlete category */
export function isSafeIntensity(intensityPct: number, category: string): boolean {
    const maxIntensity = CATEGORY_MAX_INTENSITY[category] ?? 92;
    return intensityPct <= maxIntensity;
}

/** Calculate weekly volume (total tonnage in kg) */
export function calculateWeeklyVolume(
    sessions: Array<{
        exercises: Array<{ sets: number; loadKg: number | null; repsScheme: string }>;
    }>
): number {
    let total = 0;
    for (const session of sessions) {
        for (const ex of session.exercises) {
            if (ex.loadKg) {
                const reps = parseRepsScheme(ex.repsScheme);
                total += ex.sets * reps * ex.loadKg;
            }
        }
    }
    return Math.round(total);
}

/** Parse reps from scheme strings like "4x6", "3x8-10", "5x3" */
function parseRepsScheme(scheme: string): number {
    const parts = scheme.split('x');
    if (parts.length < 2) return 8;
    const repPart = parts[1];
    if (repPart.includes('-')) {
        const [min, max] = repPart.split('-').map(Number);
        return Math.round((min + max) / 2);
    }
    return parseInt(repPart) || 8;
}

// ─────────────────────────────────────────────────────────────────────────────
// Overreaching Detection
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Detect potential overreaching based on recent RPE logs and readiness scores.
 * Uses a multi-factor approach: sustained high RPE + declining readiness.
 */
export function detectOverreaching(
    recentLogs: Array<{ rpeActual: number | null; readinessScore?: number | null; date: Date }>
): { detected: boolean; severity: 'none' | 'mild' | 'high'; message: string } {
    const sorted = recentLogs
        .filter(l => l.rpeActual !== null)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);

    if (sorted.length < 3) return { detected: false, severity: 'none', message: '' };

    const last3 = sorted.slice(0, 3);
    const allHighRpe = last3.every(l => (l.rpeActual ?? 0) >= 9);
    const avgRpe5 = sorted.reduce((s, l) => s + (l.rpeActual ?? 0), 0) / sorted.length;

    // Check readiness decline
    const readinessLogs = sorted.filter(l => l.readinessScore != null);
    const avgReadiness = readinessLogs.length > 0
        ? readinessLogs.reduce((s, l) => s + (l.readinessScore ?? 0), 0) / readinessLogs.length
        : null;
    const lowReadiness = avgReadiness !== null && avgReadiness < 5;

    if (allHighRpe && lowReadiness) {
        return {
            detected: true,
            severity: 'high',
            message: `🔴 ALERTA ALTA: RPE ≥ 9 por 3+ días y readiness promedio ${avgReadiness?.toFixed(1)}/10. Signos claros de sobreentrenamiento funcional. Recomendación: 1-2 días de recuperación activa o descarga programada antes de continuar.`,
        };
    }

    if (allHighRpe) {
        return {
            detected: true,
            severity: 'mild',
            message:
                '🟡 ALERTA MODERADA: RPE ≥ 9 por 3 días consecutivos. Monitorear readiness. Considerar reducción de volumen 20-30% o día de recuperación activa.',
        };
    }

    if (avgRpe5 >= 8.5 && lowReadiness) {
        return {
            detected: true,
            severity: 'mild',
            message: `🟡 ALERTA: RPE promedio ${avgRpe5.toFixed(1)} y readiness bajo (${avgReadiness?.toFixed(1)}/10). Fatiga acumulada elevada. Revisar carga de la semana.`,
        };
    }

    return { detected: false, severity: 'none', message: '' };
}

/** Get phase color and label for UI display */
export function getPhaseDisplay(phase: ATRPhase) {
    const map = {
        accumulation: { label: 'Acumulación', color: 'blue', emoji: '📦' },
        transformation: { label: 'Transformación', color: 'amber', emoji: '⚡' },
        realization: { label: 'Realización', color: 'emerald', emoji: '🏆' },
    };
    return map[phase];
}
