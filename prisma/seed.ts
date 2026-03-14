import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const exercises = [
    // ── FUERZA BASE ──
    { name: 'Sentadilla con Barra', muscleGroups: '["quadriceps","glutes","hamstrings","core"]', equipment: 'barbell', difficulty: 'intermediate', sportSpecific: false, cues: 'Pies al ancho de hombros, punta de pies ligeramente hacia afuera. Rodillas alineadas con los pies en todo momento. Profundidad mínima: muslos paralelos al suelo.', imageUrl: '/exercises/squat.jpg' },
    { name: 'Peso Muerto Convencional', muscleGroups: '["hamstrings","glutes","lower_back","traps"]', equipment: 'barbell', difficulty: 'advanced', sportSpecific: false, cues: 'Barra sobre el mediopié. Espalda neutra, pecho arriba. Empujar el suelo hacia abajo, no jalar la barra hacia arriba.', imageUrl: '/exercises/deadlift.jpg' },
    { name: 'Peso Muerto Rumano', muscleGroups: '["hamstrings","glutes","lower_back"]', equipment: 'barbell', difficulty: 'intermediate', sportSpecific: true, cues: 'Rodillas semi-flexionadas. Empujar las caderas hacia atrás manteniendo la barra pegada al cuerpo. Excelente para activación de isquiotibiales para el salto.', imageUrl: '/exercises/rdl.jpg' },
    { name: 'Sentadilla Búlgara', muscleGroups: '["quadriceps","glutes","hip_flexors"]', equipment: 'dumbbell', difficulty: 'intermediate', sportSpecific: true, cues: 'Pie trasero elevado a la altura de la rodilla. Rodilla delantera no supera la punta del pie. Ideal para la asimetría funcional del voleibol.', imageUrl: '/exercises/bulgarian_squat.jpg' },
    { name: 'Hip Thrust con Barra', muscleGroups: '["glutes","hamstrings","core"]', equipment: 'barbell', difficulty: 'beginner', sportSpecific: true, cues: 'Espalda alta sobre el banco. Empujar con los talones, squeezar glúteos en la cima. Fundamental para la potencia de salto.', imageUrl: '/exercises/hip_thrust.jpg' },
    { name: 'Prensa de Piernas 45°', muscleGroups: '["quadriceps","glutes"]', equipment: 'machine', difficulty: 'beginner', sportSpecific: false, cues: 'Pies al ancho de hombros en la plataforma. No bloquear rodillas en extensión completa. Útil para cargar volumen sin estrés espinal.', imageUrl: '/exercises/leg_press.jpg' },

    // ── TIRÓN VERTICAL/HORIZONTAL ──
    { name: 'Jalón al Pecho', muscleGroups: '["latissimus","biceps","rear_deltoids"]', equipment: 'cable', difficulty: 'beginner', sportSpecific: false, cues: 'Barra a la altura del pecho, pecho afuera, codos hacia abajo y atrás. Squeeze en la cima de la contracción.', imageUrl: '/exercises/lat_pulldown.jpg' },
    { name: 'Remo con Barra', muscleGroups: '["latissimus","rhomboids","rear_deltoids","biceps"]', equipment: 'barbell', difficulty: 'intermediate', sportSpecific: false, cues: 'Torso paralelo al suelo. Codos a 45° del cuerpo. Barra hasta la parte baja del abdomen.', imageUrl: '/exercises/barbell_row.jpg' },
    { name: 'Dominadas', muscleGroups: '["latissimus","biceps","core"]', equipment: 'bodyweight', difficulty: 'advanced', sportSpecific: true, cues: 'Agarre prono, ancho de hombros. Pecho hacia la barra, escápulas deprimidas. Mejora la estabilidad de hombro para el remate.', imageUrl: '/exercises/pullups.jpg' },
    { name: 'Remo en Cable Un Brazo', muscleGroups: '["latissimus","rhomboids","biceps"]', equipment: 'cable', difficulty: 'beginner', sportSpecific: false, cues: 'Rotación ligera del torso. Codo pegado al cuerpo. Permite trabajar asimetrías.', imageUrl: '/exercises/cable_row.jpg' },

    // ── EMPUJE ──
    { name: 'Press de Banca', muscleGroups: '["pectorals","triceps","anterior_deltoid"]', equipment: 'barbell', difficulty: 'intermediate', sportSpecific: false, cues: 'Omóplatos retraídos y deprimidos. Barra baja al esternón. Empuje diagonal hacia arriba.', imageUrl: '/exercises/bench_press.jpg' },
    { name: 'Press Militar', muscleGroups: '["deltoids","triceps","upper_traps"]', equipment: 'barbell', difficulty: 'intermediate', sportSpecific: true, cues: 'De pie, core activado. Barra desde clavículas, empujar verticalmente. Directo para la acción del remate.', imageUrl: '/exercises/overhead_press.jpg' },
    { name: 'Fondos en paralelas', muscleGroups: '["pectorals","triceps","anterior_deltoid"]', equipment: 'bodyweight', difficulty: 'intermediate', sportSpecific: false, cues: 'Ligera inclinación hacia delante para enfatizar pectoral. Codos a 45°. Rango completo.', imageUrl: '/exercises/dips.jpg' },

    // ── OLÍMPICOS / POTENCIA ──
    { name: 'Colgada de Potencia (Hang Clean)', muscleGroups: '["full_body","traps","glutes","quadriceps"]', equipment: 'barbell', difficulty: 'advanced', sportSpecific: true, cues: 'Posición de anclaje: cadera a la altura de las rodillas. Triple extensión explosiva (tobillo, rodilla, cadera). Fundamental para potencia de salto.', imageUrl: '/exercises/hang_clean.jpg' },
    { name: 'Cargada de Potencia (Power Clean)', muscleGroups: '["full_body","traps","glutes","quadriceps"]', equipment: 'barbell', difficulty: 'advanced', sportSpecific: true, cues: 'Arranque desde el suelo. Barra pegada a las espinillas. Triple extensión + tirar con los codos altos.', imageUrl: '/exercises/power_clean.jpg' },
    { name: 'Snatch de Agarre Ancho', muscleGroups: '["full_body","deltoids","traps"]', equipment: 'barbell', difficulty: 'advanced', sportSpecific: true, cues: 'Agarre muy abierto. Extensión máxima antes del tirón. Transferencia directa a la aceleración del brazo en el remate.', imageUrl: '/exercises/snatch.jpg' },
    { name: 'Push Press', muscleGroups: '["deltoids","triceps","glutes","quadriceps"]', equipment: 'barbell', difficulty: 'intermediate', sportSpecific: true, cues: 'Pequeño drive de piernas, transferir fuerza a los brazos. Ideal para la fase de Transformación.', imageUrl: '/exercises/push_press.jpg' },

    // ── CORE / ESTABILIZACIÓN ──
    { name: 'Plancha Frontal', muscleGroups: '["core","anterior_chain"]', equipment: 'bodyweight', difficulty: 'beginner', sportSpecific: false, cues: 'Cuerpo alineado de cabeza a talones. No dejar caer la cadera. Respiración diafragmática.', imageUrl: '/exercises/plank.jpg' },
    { name: 'Plancha Lateral', muscleGroups: '["obliques","core","glute_med"]', equipment: 'bodyweight', difficulty: 'beginner', sportSpecific: true, cues: 'Cadera elevada. Apretar glúteo superior. Importante para estabilidad lateral en los cambios de dirección.', imageUrl: '/exercises/side_plank.jpg' },
    { name: 'Dead Bug', muscleGroups: '["core","hip_flexors"]', equipment: 'bodyweight', difficulty: 'beginner', sportSpecific: false, cues: 'Zona lumbar pegada al suelo todo el tiempo. Movimientos lentos y controlados. Brazos y piernas opuestas.', imageUrl: '/exercises/dead_bug.jpg' },
    { name: 'Pallof Press', muscleGroups: '["core","obliques"]', equipment: 'cable', difficulty: 'beginner', sportSpecific: true, cues: 'De pie lateral al cable. Resistir la rotación. Fortalece el core anti-rotacional, clave en el saque.', imageUrl: '/exercises/pallof_press.jpg' },
    { name: 'Turkish Get Up', muscleGroups: '["full_body","core","shoulder_stability"]', equipment: 'dumbbell', difficulty: 'advanced', sportSpecific: true, cues: 'Ojo fijo en la pesa. Cada fase es controlada. Excelente para estabilidad de hombro de la mano de remate.', imageUrl: '/exercises/turkish_getup.jpg' },

    // ── PLIOMETRÍA / POTENCIA ESPECÍFICA ──
    { name: 'Salto Vertical con Contramovement (CMJ)', muscleGroups: '["glutes","quadriceps","calves"]', equipment: 'bodyweight', difficulty: 'intermediate', sportSpecific: true, cues: 'Brazos que suman a la velocidad. Aterrizaje suave, amortiguando en cadena (tobillo-rodilla-cadera). Medición de altura de salto.', imageUrl: '/exercises/cmj.jpg' },
    { name: 'Drop Jump', muscleGroups: '["calves","quadriceps","glutes"]', equipment: 'bodyweight', difficulty: 'advanced', sportSpecific: true, cues: 'Caída desde cajón. Contacto mínimo en el suelo (<250ms). Rebotar explosivamente. Entrena el ciclo estiramiento-acortamiento.', imageUrl: '/exercises/drop_jump.jpg' },
    { name: 'Salto en Cajón (Box Jump)', muscleGroups: '["glutes","quadriceps","hamstrings"]', equipment: 'bodyweight', difficulty: 'intermediate', sportSpecific: true, cues: 'Aterrizaje suave en el cajón. Bajar caminando, nunca saltando. Enfocarse en la explosividad de la extensión de cadera.', imageUrl: '/exercises/box_jump.jpg' },
    { name: 'Salto Lateral en Cono', muscleGroups: '["glutes","abductors","calves"]', equipment: 'bodyweight', difficulty: 'intermediate', sportSpecific: true, cues: 'Saltos laterales explosivos sobre conos. Simula los desplazamientos laterales de la defensa en VB de playa.', imageUrl: '/exercises/lateral_jumps.jpg' },

    // ── ISQUIOTIBIALES / PREVENCIÓN ──
    { name: 'Nordic Curl', muscleGroups: '["hamstrings"]', equipment: 'bodyweight', difficulty: 'advanced', sportSpecific: true, cues: 'Caída lenta y controlada desde rodillas. Usos las manos para frenar al final. Probada prevención de lesiones de isquiotibiales.', imageUrl: '/exercises/nordic_curl.jpg' },
    { name: 'Curl de Isquiotibiales en Máquina', muscleGroups: '["hamstrings"]', equipment: 'machine', difficulty: 'beginner', sportSpecific: false, cues: 'Rango completo de movimiento. Bajar la carga lentamente (2-3 seg). Útil para volumen en etapa de acumulación.', imageUrl: '/exercises/leg_curl.jpg' },
    { name: 'Good Morning con Barra', muscleGroups: '["hamstrings","lower_back","glutes"]', equipment: 'barbell', difficulty: 'intermediate', sportSpecific: false, cues: 'Barra en trapecios, no en cuello. Cadera hacia atrás, espalda neutra. Refuerza la cadena posterior.', imageUrl: '/exercises/good_morning.jpg' },

    // ── HOMBRO / MANGUITO ──
    { name: 'Face Pull con Cable', muscleGroups: '["rear_deltoids","rotator_cuff","rhomboids"]', equipment: 'cable', difficulty: 'beginner', sportSpecific: true, cues: 'Cuerda a nivel de nariz. Tirar hacia la cara con codos altos. Fundamental para la salud del hombro del brazo de remate.', imageUrl: '/exercises/face_pull.jpg' },
    { name: 'Rotación Externa con Banda', muscleGroups: '["rotator_cuff","infraspinatus"]', equipment: 'band', difficulty: 'beginner', sportSpecific: true, cues: 'Codo pegado al cuerpo a 90°. Movimiento lento y controlado. Trabajo preventivo de manguito rotador.', imageUrl: '/exercises/external_rotation.jpg' },
];

async function main() {
    console.log('🌱 Starting database seed...');

    // ── Users ──
    const adminPassword = await bcrypt.hash('admin123', 10);
    const coachPassword = await bcrypt.hash('coach123', 10);
    const athletePassword = await bcrypt.hash('atleta123', 10);

    const admin = await prisma.user.upsert({
        where: { email: 'admin@vbfuerza.com' },
        update: {},
        create: { email: 'admin@vbfuerza.com', password: adminPassword, name: 'Administrador', role: 'admin' },
    });

    const coach = await prisma.user.upsert({
        where: { email: 'coach@vbfuerza.com' },
        update: {},
        create: { email: 'coach@vbfuerza.com', password: coachPassword, name: 'Carlos Méndez', role: 'coach' },
    });

    const athleteUser = await prisma.user.upsert({
        where: { email: 'atleta@vbfuerza.com' },
        update: {},
        create: { email: 'atleta@vbfuerza.com', password: athletePassword, name: 'María López', role: 'athlete' },
    });

    // ── Athlete Profile ──
    const athlete = await prisma.athleteProfile.upsert({
        where: { userId: athleteUser.id },
        update: {},
        create: {
            userId: athleteUser.id,
            fullName: 'María López',
            gender: 'female',
            category: 'U21',
            bodyWeightKg: 62,
            position: 'attacker',
            oneRmRecords: JSON.stringify({ squat: 80, deadlift: 90, bench_press: 50, overhead_press: 35, hang_clean: 55 }),
        },
    });

    // ── Exercises ──
    console.log(`📚 Seeding ${exercises.length} exercises...`);
    for (const ex of exercises) {
        await prisma.exercise.upsert({
            where: { id: ex.name }, // use name as temp check
            update: {},
            create: ex,
        }).catch(async () => {
            // If not found by id, create fresh
            await prisma.exercise.create({ data: ex }).catch(() => { });
        });
    }

    // Let's just delete and recreate exercises for clean seed
    await prisma.exercise.deleteMany({});
    for (const ex of exercises) {
        await prisma.exercise.create({ data: ex });
    }

    // ── Sample Training Plan (12-week ATR) ──
    const plan = await prisma.trainingPlan.create({
        data: {
            athleteId: athlete.id,
            coachId: coach.id,
            name: 'Pretemporada 2025 — U21 Femenino',
            description: 'Plan ATR de 12 semanas orientado al pico de forma para el torneo nacional de voleibol de playa.',
            startDate: new Date('2025-03-01'),
            endDate: new Date('2025-05-24'),
            competitionDate: new Date('2025-05-31'),
            status: 'active',
        },
    });

    // ── Mesocycles ──
    const accumulation = await prisma.mesocycle.create({
        data: {
            planId: plan.id,
            atrPhase: 'accumulation',
            orderIndex: 1,
            durationWeeks: 4,
            primaryGoal: 'Desarrollo de la fuerza máxima base',
            intensityRange: JSON.stringify({ min: 65, max: 75 }),
            volumeSetsRange: JSON.stringify({ min: 4, max: 5 }),
            notes: 'Énfasis en técnica y volumen. Ejercicios multiarticulares con carga progresiva cada semana.',
        },
    });

    const transformation = await prisma.mesocycle.create({
        data: {
            planId: plan.id,
            atrPhase: 'transformation',
            orderIndex: 2,
            durationWeeks: 4,
            primaryGoal: 'Conversión de fuerza en potencia específica',
            intensityRange: JSON.stringify({ min: 78, max: 88 }),
            volumeSetsRange: JSON.stringify({ min: 3, max: 4 }),
            notes: 'Introducir ejercicios olímpicos. Reducir volumen, aumentar intensidad y velocidad de ejecución.',
        },
    });

    const realization = await prisma.mesocycle.create({
        data: {
            planId: plan.id,
            atrPhase: 'realization',
            orderIndex: 3,
            durationWeeks: 4,
            primaryGoal: 'Pico de forma y taper pre-competencia',
            intensityRange: JSON.stringify({ min: 88, max: 95 }),
            volumeSetsRange: JSON.stringify({ min: 2, max: 3 }),
            notes: 'Volumen mínimo, intensidad máxima. Taper progresivo últimas 2 semanas. Monitoreo de carga diario.',
        },
    });

    // ── Sample Session in Accumulation (Week 1, Monday) ──
    const allExercises = await prisma.exercise.findMany();
    const getExercise = (name: string) => allExercises.find(e => e.name === name);

    const session1 = await prisma.trainingSession.create({
        data: {
            mesocycleId: accumulation.id,
            weekNumber: 1,
            dayOfWeek: 'monday',
            sessionType: 'strength',
            estimatedDurationMin: 75,
            notes: 'Sesión A — Tren inferior predominante',
        },
    });

    const squat = getExercise('Sentadilla con Barra');
    const rdl = getExercise('Peso Muerto Rumano');
    const hipThrust = getExercise('Hip Thrust con Barra');
    const bulg = getExercise('Sentadilla Búlgara');

    if (squat && rdl && hipThrust && bulg) {
        await prisma.sessionExercise.createMany({
            data: [
                { sessionId: session1.id, exerciseId: squat.id, orderIndex: 1, sets: 4, repsScheme: '4x6', intensityPctRm: 75, loadKg: Math.round(80 * 0.75), restSeconds: 180, tempo: '3-1-1-0', rpeTarget: 7 },
                { sessionId: session1.id, exerciseId: rdl.id, orderIndex: 2, sets: 4, repsScheme: '4x8', intensityPctRm: 70, loadKg: Math.round(90 * 0.7), restSeconds: 150, tempo: '3-1-1-0', rpeTarget: 7 },
                { sessionId: session1.id, exerciseId: hipThrust.id, orderIndex: 3, sets: 4, repsScheme: '4x10', intensityPctRm: 65, loadKg: Math.round(80 * 0.65), restSeconds: 120, tempo: '2-1-2-0', rpeTarget: 7 },
                { sessionId: session1.id, exerciseId: bulg.id, orderIndex: 4, sets: 3, repsScheme: '3x10', intensityPctRm: 60, loadKg: Math.round(62 * 0.6), restSeconds: 90, tempo: '2-0-2-0', rpeTarget: 7 },
            ],
        });
    }

    console.log('✅ Seed completed!');
    console.log('\n📋 Demo credentials:');
    console.log('  Admin   → admin@vbfuerza.com / admin123');
    console.log('  Coach   → coach@vbfuerza.com / coach123');
    console.log('  Athlete → atleta@vbfuerza.com / atleta123');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
