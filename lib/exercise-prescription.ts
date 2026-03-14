/**
 * Exercise Prescription Engine — ATR Phase-Based Categorization
 * ─────────────────────────────────────────────────────────────────────────────
 * Scientific basis:
 * - Force-Velocity curve (Hill, 1938)
 * - Stretch-Shortening Cycle / SSC (Bosco, 1982)
 * - Complex/Contrast Training (Ebben, 2002; Duthie, 2002)
 * - Transfer specificity for beach volleyball (Sheppard, 2008)
 */

import type { ATRPhase } from './atr-engine';

// ─────────────────────────────────────────────────────────────────────────────
// Exercise Type Taxonomy
// ─────────────────────────────────────────────────────────────────────────────

export type ExerciseType =
    | 'compound'        // Multi-joint strength: squat, deadlift, bench, row, press
    | 'olympic'         // Olympic weightlifting: clean, snatch, jerk, high pull
    | 'ballistic'       // Ballistic/power: push press, KB swing, med ball throws
    | 'plyometric_low'  // Low-impact plyometrics: box jump, CMJ, squat jump, hurdle hops
    | 'plyometric_high' // High-impact plyometrics: drop jump, reactive, single-leg, spikejos
    | 'transfer'        // Sport-specific beach volleyball transfer exercises
    | 'accessory';      // Isolation/corrective: face pulls, curls, calf raises

export type ImpactLevel = 'none' | 'low' | 'medium' | 'high';

export interface ExercisePrescription {
    name: string;
    exerciseType: ExerciseType;
    atrPhases: ATRPhase[];
    impactLevel: ImpactLevel;
    /** Name of the paired exercise for contrast/complex training */
    contrastPairName?: string;
    repsScheme: string;
    sets: number;
    intensityPctRm?: number;
    tempo?: string;
    rpeTarget?: number;
    restSeconds: number;
    notes?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// ATR Phase Rules (what is ALLOWED per phase)
// ─────────────────────────────────────────────────────────────────────────────

export interface ATRPhaseRules {
    allowedTypes: ExerciseType[];
    forbiddenTypes: ExerciseType[];
    maxImpactLevel: ImpactLevel;
    contrastTraining: boolean;
    primaryFocus: string;
    prescriptionRationale: string;
}

const impactOrder: Record<ImpactLevel, number> = { none: 0, low: 1, medium: 2, high: 3 };

export const ATR_PHASE_RULES: Record<ATRPhase, ATRPhaseRules> = {
    accumulation: {
        allowedTypes: ['compound', 'accessory'],
        forbiddenTypes: ['plyometric_high', 'transfer'],
        maxImpactLevel: 'low',
        contrastTraining: false,
        primaryFocus: 'Fuerza máxima e hipertrofia funcional',
        prescriptionRationale:
            'En Acumulación NO se prescribe pliometría intensa ni transferencias específicas. El SNC acumulará fatiga con cargas pesadas y no puede gestionar estímulos de alta velocidad/impacto simultáneamente. El objetivo es elevar el potencial motor mediante cargas altas (80–100% 1RM para fuerza máxima) o medias (70–85% 1RM para hipertrofia). Ejercicios básicos, generales y multiarticulares.',
    },
    transformation: {
        allowedTypes: ['compound', 'olympic', 'ballistic', 'plyometric_low', 'accessory'],
        forbiddenTypes: ['plyometric_high'],
        maxImpactLevel: 'medium',
        contrastTraining: true,
        primaryFocus: 'Conversión de fuerza en potencia + pliometría básica + método de contrastes',
        prescriptionRationale:
            'En Transformación se convierte la fuerza base en fuerza explosiva/potencia. Se introducen levantamientos olímpicos (Clean, Snatch, Push Press, High Pull), ejercicios balísticos y pliometría de BAJO-MEDIO impacto (Box Jump, CMJ, Squat Jump, vallas). El MÉTODO DE CONTRASTES (Complex Training) combina una serie pesada seguida inmediatamente de un ejercicio explosivo. Ej: Sentadilla 85% → CMJ.',
    },
    realization: {
        allowedTypes: ['olympic', 'ballistic', 'plyometric_high', 'transfer', 'compound'],
        forbiddenTypes: ['accessory'],
        maxImpactLevel: 'high',
        contrastTraining: false,
        primaryFocus: 'Pliometría reactiva de alto impacto + transferencia específica beach volleyball',
        prescriptionRationale:
            'En Realización el volumen cae 40–60%. Se prescribe la MÁXIMA velocidad: Drop Jumps (CEA rápidos), multisaltos reactivos, saltos a una pierna, lanzamientos explosivos de balón medicinal. Los EJERCICIOS DE TRANSFERENCIA simulan exactamente la biomecánica competitiva del voleibol de playa: remates, bloqueos, defensas, desplazamientos laterales. Se ejecutan a velocidad máxima con resistencia ligera (banda elástica o chaleco lastrado 3–5% PC).',
    },
};

/**
 * Check if an exercise is appropriate for a given ATR phase.
 */
export function isAppropriateForPhase(
    exerciseType: ExerciseType,
    impactLevel: ImpactLevel,
    phase: ATRPhase
): boolean {
    const rules = ATR_PHASE_RULES[phase];
    if (rules.forbiddenTypes.includes(exerciseType)) return false;
    if (!rules.allowedTypes.includes(exerciseType)) return false;
    if (impactOrder[impactLevel] > impactOrder[rules.maxImpactLevel]) return false;
    return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// Phase-based prescription parameters
// ─────────────────────────────────────────────────────────────────────────────

export interface PrescriptionParams {
    sets: number;
    repsScheme: string;
    intensityPctRm: number;
    tempo: string;
    restSeconds: number;
    rpeTarget: number;
    notes?: string;
}

export function getPrescriptionParams(
    exerciseType: ExerciseType,
    phase: ATRPhase,
    focus: 'maxStrength' | 'hypertrophy' | 'power' | 'reactive' = 'maxStrength'
): PrescriptionParams {
    // Accumulation
    if (phase === 'accumulation') {
        if (focus === 'maxStrength') {
            return { sets: 5, repsScheme: '5x3-5', intensityPctRm: 88, tempo: '3-1-1-0', restSeconds: 180, rpeTarget: 8 };
        }
        return { sets: 4, repsScheme: '4x6-10', intensityPctRm: 75, tempo: '3-1-1-0', restSeconds: 120, rpeTarget: 7 };
    }

    // Transformation
    if (phase === 'transformation') {
        if (exerciseType === 'olympic') {
            return { sets: 5, repsScheme: '5x3', intensityPctRm: 82, tempo: 'X-0-X-0', restSeconds: 150, rpeTarget: 8, notes: 'Máxima velocidad en la tirón. No descender la barra con control.' };
        }
        if (exerciseType === 'plyometric_low') {
            return { sets: 4, repsScheme: '4x6-8', intensityPctRm: 0, tempo: 'X-0-X-0', restSeconds: 90, rpeTarget: 7, notes: 'Máx. altura/velocidad. Aterrizaje suave y controlado.' };
        }
        if (exerciseType === 'ballistic') {
            return { sets: 4, repsScheme: '4x5', intensityPctRm: 0, tempo: 'X-X-X-0', restSeconds: 90, rpeTarget: 7 };
        }
        // Contrast compound
        return { sets: 4, repsScheme: '4x4-6', intensityPctRm: 85, tempo: '2-0-1-0', restSeconds: 120, rpeTarget: 8 };
    }

    // Realization
    if (exerciseType === 'plyometric_high') {
        return { sets: 4, repsScheme: '4x5', intensityPctRm: 0, tempo: 'X-0-X-0', restSeconds: 120, rpeTarget: 8, notes: 'Ciclo estiramiento-acortamiento MÍNIMO. Máx. fuerza reactiva. Medir tiempo de contacto.' };
    }
    if (exerciseType === 'transfer') {
        return { sets: 4, repsScheme: '4x4-6', intensityPctRm: 0, tempo: 'X-X-X-X', restSeconds: 90, rpeTarget: 8, notes: 'Velocidad competitiva máxima. Resistencia ligera: banda o chaleco 3–5% PC.' };
    }
    if (exerciseType === 'olympic') {
        return { sets: 3, repsScheme: '3x2-3', intensityPctRm: 88, tempo: 'X-0-X-0', restSeconds: 180, rpeTarget: 9 };
    }
    // Heavy singles for realization
    return { sets: 3, repsScheme: '3x1-3', intensityPctRm: 92, tempo: '1-0-X-0', restSeconds: 210, rpeTarget: 9 };
}

// ─────────────────────────────────────────────────────────────────────────────
// Contrast/Complex Training Pairs
// ─────────────────────────────────────────────────────────────────────────────

export interface ContrastPair {
    heavyExercise: string;
    explosiveExercise: string;
    restBetweenPairSeconds: number;
    restAfterPairSeconds: number;
    targetBodyPart: 'lower' | 'upper' | 'total';
    scientificRationale: string;
}

export const CONTRAST_PAIRS: ContrastPair[] = [
    {
        heavyExercise: 'Sentadilla con Barra',
        explosiveExercise: 'Salto Vertical con Contramovement (CMJ)',
        restBetweenPairSeconds: 10,
        restAfterPairSeconds: 180,
        targetBodyPart: 'lower',
        scientificRationale: 'Post-Activation Potentiation (PAP): la sentadilla pesada potencia la activación neural, aumentando la altura del CMJ 3-12% (Ebben, 2002).',
    },
    {
        heavyExercise: 'Sentadilla con Barra',
        explosiveExercise: 'Salto al Cajón (Box Jump)',
        restBetweenPairSeconds: 15,
        restAfterPairSeconds: 180,
        targetBodyPart: 'lower',
        scientificRationale: 'El Box Jump elimina el aterrizaje de impacto, permitiendo mayor frecuencia en la fase de transformación.',
    },
    {
        heavyExercise: 'Press de Banca',
        explosiveExercise: 'Lanzamiento Balón Medicinal (Chest Pass)',
        restBetweenPairSeconds: 10,
        restAfterPairSeconds: 150,
        targetBodyPart: 'upper',
        scientificRationale: 'Transferencia de potencia de tren superior: crítico para remates y saque potente en voleibol de playa.',
    },
    {
        heavyExercise: 'Press Militar',
        explosiveExercise: 'Lanzamiento Balón Medicinal (Overhead)',
        restBetweenPairSeconds: 10,
        restAfterPairSeconds: 150,
        targetBodyPart: 'upper',
        scientificRationale: 'Simula el patrón de empuje overhead del remate de voleibol. La PAP mejora la velocidad de raqueta/mano hasta 8%.',
    },
    {
        heavyExercise: 'Peso Muerto Convencional',
        explosiveExercise: 'Swing con Kettlebell',
        restBetweenPairSeconds: 15,
        restAfterPairSeconds: 180,
        targetBodyPart: 'lower',
        scientificRationale: 'El patrón hip-hinge del peso muerto potencia la extensión explosiva de cadena posterior, clave para el salto de bloqueo.',
    },
    {
        heavyExercise: 'Hip Thrust con Barra',
        explosiveExercise: 'Multisaltos Horizontales (Bounding)',
        restBetweenPairSeconds: 10,
        restAfterPairSeconds: 150,
        targetBodyPart: 'lower',
        scientificRationale: 'El hip thrust activa máximamente glúteo. El bounding traslada esa fuerza al ciclo estiramiento-acortamiento horizontal de los desplazamientos en arena.',
    },
];

export function getContrastPairsForPhase(phase: ATRPhase): ContrastPair[] {
    if (!ATR_PHASE_RULES[phase].contrastTraining) return [];
    return CONTRAST_PAIRS;
}

export function findContrastPair(exerciseName: string): ContrastPair | undefined {
    return CONTRAST_PAIRS.find(p => p.heavyExercise === exerciseName);
}

// ─────────────────────────────────────────────────────────────────────────────
// Beach Volleyball Transfer Exercises
// ─────────────────────────────────────────────────────────────────────────────

export interface TransferExercise {
    name: string;
    biomechanicalSimulation: string;
    resistance: string;
    volleyballGesture: string;
    position: 'attacker' | 'defender' | 'both';
    sets: number;
    repsScheme: string;
    rpeTarget: number;
}

export const VB_TRANSFER_EXERCISES: TransferExercise[] = [
    {
        name: 'Remate con Chaleco Lastrado',
        biomechanicalSimulation: 'Saltabilidad + golpe overhead a máxima velocidad',
        resistance: 'Chaleco lastrado 3–5% peso corporal',
        volleyballGesture: 'Remate (spike)',
        position: 'attacker',
        sets: 4,
        repsScheme: '4x5',
        rpeTarget: 9,
    },
    {
        name: 'Bloqueo con Banda Elástica',
        biomechanicalSimulation: 'Extensión vertical explosiva de brazos en la red',
        resistance: 'Banda elástica media anclada al suelo',
        volleyballGesture: 'Bloqueo',
        position: 'both',
        sets: 4,
        repsScheme: '4x6',
        rpeTarget: 8,
    },
    {
        name: 'Defensa Reactiva (Dive) con Banda',
        biomechanicalSimulation: 'Desplazamiento lateral explosivo + posición de defensa',
        resistance: 'Banda elástica lateral resistida',
        volleyballGesture: 'Defensa de campo (dig)',
        position: 'defender',
        sets: 4,
        repsScheme: '4x6',
        rpeTarget: 8,
    },
    {
        name: 'Salto de Bloqueo Reactivo (señal visual)',
        biomechanicalSimulation: 'React-and-jump ante estímulo visual, simula lectura de ataque',
        resistance: 'Peso corporal (o chaleco ligero)',
        volleyballGesture: 'Bloqueo reactivo',
        position: 'both',
        sets: 5,
        repsScheme: '5x4',
        rpeTarget: 9,
    },
    {
        name: 'Desplazamiento Lateral Explosivo + Salto',
        biomechanicalSimulation: 'Sprint lateral en arena + elevación para defensa',
        resistance: 'Peso corporal',
        volleyballGesture: 'Desplazamiento defensivo',
        position: 'defender',
        sets: 4,
        repsScheme: '4x6',
        rpeTarget: 8,
    },
    {
        name: 'Saque con Chaleco Lastrado',
        biomechanicalSimulation: 'Patrón de saque potenciado con carga adicional leve',
        resistance: 'Chaleco lastrado 3–5% PC',
        volleyballGesture: 'Saque',
        position: 'both',
        sets: 3,
        repsScheme: '3x8',
        rpeTarget: 7,
    },
    {
        name: 'Ataque con Banda Elástica (simulación)',
        biomechanicalSimulation: 'Rotación de tronco + extensión de brazo con resistencia progresiva',
        resistance: 'Banda elástica anclada a la red/poste',
        volleyballGesture: 'Remate (simulación con banda)',
        position: 'attacker',
        sets: 4,
        repsScheme: '4x6',
        rpeTarget: 8,
    },
    {
        name: 'Salto-Recepción de Balón (overhead)',
        biomechanicalSimulation: 'Percepción → jump → contacto over cabeza → aterrizaje controlado',
        resistance: 'Balón medicinal 1 kg',
        volleyballGesture: 'Set (colocación aérea)',
        position: 'both',
        sets: 3,
        repsScheme: '3x8',
        rpeTarget: 7,
    },
];

export function getTransferExercisesForPosition(position: 'attacker' | 'defender'): TransferExercise[] {
    return VB_TRANSFER_EXERCISES.filter(e => e.position === 'both' || e.position === position);
}

// ─────────────────────────────────────────────────────────────────────────────
// Session Template Generator
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate a recommended exercise order for a session template based on ATR phase.
 * Returns an ordered list of exercise groups with their prescription notes.
 */
export function generateSessionTemplate(phase: ATRPhase, position: 'attacker' | 'defender' = 'attacker') {
    const rules = ATR_PHASE_RULES[phase];

    const templates: Record<ATRPhase, Array<{
        block: string;
        exerciseTypes: ExerciseType[];
        order: number;
        notes: string;
    }>> = {
        accumulation: [
            { block: 'A — Activación Neural', exerciseTypes: ['compound'], order: 1, notes: 'Ejercicio principal de fuerza máxima. 80–100% 1RM, series de 1–5 reps. Máxima concentración técnica.' },
            { block: 'B — Fuerza Máxima / Hipertrofia', exerciseTypes: ['compound'], order: 2, notes: 'Ejercicio secundario de fuerza máxima o hipertrofia. 70–85% 1RM, 4–6 series.' },
            { block: 'C — Trabajo Complementario', exerciseTypes: ['compound', 'accessory'], order: 3, notes: 'Ejercicios accesorios de fuerza general. Sin pliometría.' },
        ],
        transformation: [
            { block: 'A — Levantamiento Olímpico', exerciseTypes: ['olympic'], order: 1, notes: 'Siempre al inicio (SNC fresco). Máxima velocidad de ejecución. 75–85% 1RM.' },
            { block: 'B — Contraste Fuerza-Explosión', exerciseTypes: ['compound', 'plyometric_low'], order: 2, notes: 'MÉTODO DE CONTRASTES: serie pesada (4–6 RM) seguida de 10 seg de descanso → serie explosiva. 3–4 pares.' },
            { block: 'C — Pliometría Submáxima', exerciseTypes: ['plyometric_low', 'ballistic'], order: 3, notes: 'Box Jumps, CMJ, Squat Jumps, vallas. Bajo-medio impacto. Aterrizaje controlado.' },
        ],
        realization: [
            { block: 'A — Activación de Alta Intensidad', exerciseTypes: ['olympic', 'compound'], order: 1, notes: 'Singles o dobles pesados (90–95% 1RM) ó clean pesado. SNC fresco, máxima potencia.' },
            { block: 'B — Pliometría Reactiva', exerciseTypes: ['plyometric_high'], order: 2, notes: 'DROP JUMPS: ciclo CEA mínimo. Medir tiempo de contacto en suelo (<250ms ideal). 4–5 series x 4–6 reps.' },
            { block: 'C — Transferencia Específica VB', exerciseTypes: ['transfer'], order: 3, notes: 'Gestos técnicos del voleibol de playa a máxima velocidad. Chaleco lastrado o banda elástica ligera.' },
        ],
    };

    return {
        phase,
        rules,
        sessionBlocks: templates[phase],
        contrastPairs: getContrastPairsForPhase(phase),
        transferExercises: phase === 'realization' ? getTransferExercisesForPosition(position) : [],
    };
}
