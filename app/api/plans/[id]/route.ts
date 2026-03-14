// API: GET, PUT, DELETE /api/plans/[id]
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const plan = await prisma.trainingPlan.findUnique({
        where: { id: params.id },
        include: {
            athlete: { include: { user: { select: { email: true } } } },
            coach: { select: { name: true, email: true } },
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
    return NextResponse.json(plan);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await auth();
    if (!session || !['admin', 'coach'].includes((session.user as any)?.role))
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const { name, description, startDate, endDate, competitionDate, status } = body;

    const plan = await prisma.trainingPlan.update({
        where: { id: params.id },
        data: {
            name,
            description,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
            competitionDate: competitionDate ? new Date(competitionDate) : null,
            status,
        },
    });

    return NextResponse.json(plan);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await auth();
    if (!session || !['admin', 'coach'].includes((session.user as any)?.role))
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await prisma.trainingPlan.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
}
