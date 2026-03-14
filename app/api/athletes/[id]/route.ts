// API: GET, PUT, DELETE /api/athletes/[id]
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const athlete = await prisma.athleteProfile.findUnique({
        where: { id: params.id },
        include: {
            user: { select: { email: true, name: true, role: true } },
            plans: {
                orderBy: { createdAt: 'desc' },
                include: { mesocycles: { orderBy: { orderIndex: 'asc' } } },
            },
        },
    });

    if (!athlete) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(athlete);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await auth();
    if (!session || !['admin', 'coach'].includes((session.user as any)?.role))
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const { fullName, gender, category, bodyWeightKg, position, birthDate, oneRmRecords, notes } = body;

    const athlete = await prisma.athleteProfile.update({
        where: { id: params.id },
        data: {
            fullName,
            gender,
            category,
            bodyWeightKg: bodyWeightKg ? parseFloat(bodyWeightKg) : undefined,
            position,
            birthDate: birthDate ? new Date(birthDate) : null,
            oneRmRecords: oneRmRecords ? JSON.stringify(oneRmRecords) : undefined,
            notes,
        },
    });

    return NextResponse.json(athlete);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await auth();
    if (!session || !['admin', 'coach'].includes((session.user as any)?.role))
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    // Cascade deletes plans, load logs etc via Prisma relations
    await prisma.athleteProfile.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
}
