// API: GET, POST /api/plans/[id]/sessions
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const plan = await prisma.trainingPlan.findUnique({
        where: { id: params.id },
        include: {
            mesocycles: {
                orderBy: { orderIndex: 'asc' },
                include: {
                    sessions: {
                        orderBy: [{ weekNumber: 'asc' }, { dayOfWeek: 'asc' }],
                        include: {
                            exercises: {
                                orderBy: { orderIndex: 'asc' },
                                include: { exercise: true },
                            },
                        },
                    },
                },
            },
        },
    });

    if (!plan) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(plan.mesocycles);
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await auth();
    if (!session || !['admin', 'coach'].includes((session.user as any)?.role))
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const { mesocycleId, weekNumber, dayOfWeek, sessionType, estimatedDurationMin, notes } = body;

    if (!mesocycleId) return NextResponse.json({ error: 'mesocycleId required' }, { status: 400 });

    const trainingSession = await prisma.trainingSession.create({
        data: {
            mesocycleId,
            weekNumber: weekNumber ?? 1,
            dayOfWeek: dayOfWeek ?? 'monday',
            sessionType: sessionType ?? 'strength',
            estimatedDurationMin: estimatedDurationMin ?? 60,
            notes,
        },
        include: { exercises: { include: { exercise: true } } },
    });

    return NextResponse.json(trainingSession, { status: 201 });
}
