import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const coachId = searchParams.get('coachId');

    const athletes = await prisma.athleteProfile.findMany({
        where: coachId
            ? { plans: { some: { coachId } } }
            : undefined,
        include: {
            user: { select: { email: true, name: true } },
            plans: { select: { id: true, name: true, status: true } },
        },
        orderBy: { fullName: 'asc' },
    });

    return NextResponse.json(athletes);
}

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { userId, fullName, gender, category, bodyWeightKg, position, birthDate, oneRmRecords } = body;

    const athlete = await prisma.athleteProfile.create({
        data: {
            userId,
            fullName,
            gender,
            category,
            bodyWeightKg: bodyWeightKg ?? 70,
            position: position ?? 'attacker',
            birthDate: birthDate ? new Date(birthDate) : undefined,
            oneRmRecords: oneRmRecords ?? '{}',
        },
        include: { user: { select: { email: true, name: true } } },
    });

    return NextResponse.json(athlete, { status: 201 });
}
