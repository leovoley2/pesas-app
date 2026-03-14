import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const athleteId = searchParams.get('athleteId');
    const coachId = (session.user as any).id;

    const plans = await prisma.trainingPlan.findMany({
        where: {
            ...(athleteId ? { athleteId } : { coachId }),
        },
        include: {
            athlete: { select: { fullName: true, category: true, gender: true } },
            mesocycles: { orderBy: { orderIndex: 'asc' } },
            _count: { select: { mesocycles: true } },
        },
        orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(plans);
}

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { athleteId, name, description, startDate, endDate, competitionDate } = body;
    const coachId = (session.user as any).id;

    const plan = await prisma.trainingPlan.create({
        data: {
            athleteId,
            coachId,
            name,
            description,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            competitionDate: competitionDate ? new Date(competitionDate) : undefined,
            status: 'active',
        },
        include: {
            athlete: { select: { fullName: true, category: true, gender: true } },
            mesocycles: true,
        },
    });

    return NextResponse.json(plan, { status: 201 });
}
