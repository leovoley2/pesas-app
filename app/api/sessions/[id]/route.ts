// API: GET, PUT, DELETE /api/sessions/[id]
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const trainingSession = await prisma.trainingSession.findUnique({
        where: { id: params.id },
        include: {
            mesocycle: { include: { plan: { include: { athlete: true } } } },
            exercises: {
                orderBy: { orderIndex: 'asc' },
                include: { exercise: true },
            },
        },
    });

    if (!trainingSession) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(trainingSession);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await auth();
    if (!session || !['admin', 'coach'].includes((session.user as any)?.role))
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const { weekNumber, dayOfWeek, sessionType, estimatedDurationMin, notes } = body;

    const updated = await prisma.trainingSession.update({
        where: { id: params.id },
        data: { weekNumber, dayOfWeek, sessionType, estimatedDurationMin, notes },
    });

    return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await auth();
    if (!session || !['admin', 'coach'].includes((session.user as any)?.role))
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await prisma.trainingSession.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
}
