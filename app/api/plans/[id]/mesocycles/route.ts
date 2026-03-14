import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getATRDefaults } from '@/lib/atr-engine';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const mesocycles = await prisma.mesocycle.findMany({
        where: { planId: params.id },
        orderBy: { orderIndex: 'asc' },
        include: {
            sessions: {
                orderBy: [{ weekNumber: 'asc' }],
                include: { exercises: { include: { exercise: true }, orderBy: { orderIndex: 'asc' } } },
            },
        },
    });

    return NextResponse.json(mesocycles);
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { atrPhase, orderIndex, durationWeeks, primaryGoal, notes } = body;

    const defaults = getATRDefaults(atrPhase);

    const mesocycle = await prisma.mesocycle.create({
        data: {
            planId: params.id,
            atrPhase,
            orderIndex,
            durationWeeks: durationWeeks ?? 4,
            primaryGoal: primaryGoal ?? defaults.description,
            intensityRange: JSON.stringify(defaults.intensityRange),
            volumeSetsRange: JSON.stringify(defaults.volumeSetsRange),
            notes,
        },
    });

    return NextResponse.json(mesocycle, { status: 201 });
}
