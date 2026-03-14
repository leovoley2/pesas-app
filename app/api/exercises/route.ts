import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const atrPhase = searchParams.get('atrPhase');
    const exerciseType = searchParams.get('type');
    const sportSpecific = searchParams.get('sportSpecific');
    const search = searchParams.get('q');

    // Fetch all exercises and filter in-memory (SQLite can't query JSON easily)
    const exercises = await prisma.exercise.findMany({
        orderBy: [{ exerciseType: 'asc' }, { name: 'asc' }],
    });

    let filtered = exercises;

    // Filter by ATR phase (JSON array contains the phase)
    if (atrPhase) {
        filtered = filtered.filter(ex => {
            try {
                const phases = JSON.parse(ex.atrPhases || '[]') as string[];
                return phases.includes(atrPhase);
            } catch { return false; }
        });
    }

    // Filter by exercise type
    if (exerciseType) {
        filtered = filtered.filter(ex => ex.exerciseType === exerciseType);
    }

    // Filter by sport specific
    if (sportSpecific === 'true') {
        filtered = filtered.filter(ex => ex.sportSpecific);
    }

    // Text search
    if (search) {
        const q = search.toLowerCase();
        filtered = filtered.filter(ex =>
            ex.name.toLowerCase().includes(q) ||
            (ex.nameEn?.toLowerCase().includes(q)) ||
            ex.description?.toLowerCase().includes(q)
        );
    }

    return NextResponse.json(filtered);
}
