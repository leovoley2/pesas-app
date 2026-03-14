// API: PUT, DELETE /api/session-exercises/[id]
// Edit or remove an individual exercise from a session (admin/coach only)
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await auth();
    if (!session || !['admin', 'coach'].includes((session.user as any)?.role))
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const {
        sets,
        repsScheme,
        intensityPctRm,
        loadKg,
        restSeconds,
        tempo,
        rpeTarget,
        notes,
        orderIndex,
        isContrast,
        contrastGroupId,
    } = body;

    const updated = await prisma.sessionExercise.update({
        where: { id: params.id },
        data: {
            sets: sets !== undefined ? parseInt(sets) : undefined,
            repsScheme,
            intensityPctRm: intensityPctRm !== undefined ? parseFloat(intensityPctRm) : undefined,
            loadKg: loadKg !== undefined ? (loadKg ? parseFloat(loadKg) : null) : undefined,
            restSeconds: restSeconds !== undefined ? parseInt(restSeconds) : undefined,
            tempo,
            rpeTarget: rpeTarget !== undefined ? parseInt(rpeTarget) : undefined,
            notes,
            orderIndex: orderIndex !== undefined ? parseInt(orderIndex) : undefined,
            isContrast,
            contrastGroupId,
        },
        include: { exercise: true },
    });

    return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await auth();
    if (!session || !['admin', 'coach'].includes((session.user as any)?.role))
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const ex = await prisma.sessionExercise.findUnique({
        where: { id: params.id },
        select: { sessionId: true, orderIndex: true },
    });

    if (!ex) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    await prisma.sessionExercise.delete({ where: { id: params.id } });

    // Re-index remaining exercises in the session
    const remaining = await prisma.sessionExercise.findMany({
        where: { sessionId: ex.sessionId },
        orderBy: { orderIndex: 'asc' },
    });

    for (let i = 0; i < remaining.length; i++) {
        await prisma.sessionExercise.update({
            where: { id: remaining[i].id },
            data: { orderIndex: i + 1 },
        });
    }

    return NextResponse.json({ ok: true });
}
