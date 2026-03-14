// API: GET exercises, POST add exercise to session
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const exercises = await prisma.sessionExercise.findMany({
        where: { sessionId: params.id },
        orderBy: { orderIndex: 'asc' },
        include: { exercise: true },
    });

    return NextResponse.json(exercises);
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await auth();
    if (!session || !['admin', 'coach'].includes((session.user as any)?.role))
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const {
        exerciseId,
        sets = 3,
        repsScheme = '3x8',
        intensityPctRm,
        loadKg,
        restSeconds = 120,
        tempo,
        rpeTarget,
        notes,
        isContrast = false,
        contrastGroupId,
    } = body;

    if (!exerciseId) return NextResponse.json({ error: 'exerciseId required' }, { status: 400 });

    // Auto-assign orderIndex
    const count = await prisma.sessionExercise.count({ where: { sessionId: params.id } });

    const sessionExercise = await prisma.sessionExercise.create({
        data: {
            sessionId: params.id,
            exerciseId,
            orderIndex: count + 1,
            sets,
            repsScheme,
            intensityPctRm: intensityPctRm ? parseFloat(intensityPctRm) : null,
            loadKg: loadKg ? parseFloat(loadKg) : null,
            restSeconds,
            tempo,
            rpeTarget: rpeTarget ? parseInt(rpeTarget) : null,
            notes,
            isContrast,
            contrastGroupId,
        },
        include: { exercise: true },
    });

    return NextResponse.json(sessionExercise, { status: 201 });
}
