import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { sessionExerciseId, athleteId, actualSets, actualReps, actualLoadKg, rpeActual, readinessScore, notes } = body;

    const log = await prisma.loadLog.create({
        data: {
            sessionExerciseId,
            athleteId,
            actualSets,
            actualReps: actualReps ? JSON.stringify(actualReps) : undefined,
            actualLoadKg,
            rpeActual,
            readinessScore,
            notes,
            date: new Date(),
        },
    });

    return NextResponse.json(log, { status: 201 });
}

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const athleteId = searchParams.get('athleteId');
    const weeks = parseInt(searchParams.get('weeks') ?? '4');

    const since = new Date();
    since.setDate(since.getDate() - weeks * 7);

    const logs = await prisma.loadLog.findMany({
        where: {
            ...(athleteId ? { athleteId } : {}),
            date: { gte: since },
        },
        include: {
            sessionExercise: { include: { exercise: true } },
            athlete: { select: { fullName: true, category: true } },
        },
        orderBy: { date: 'desc' },
    });

    return NextResponse.json(logs);
}
