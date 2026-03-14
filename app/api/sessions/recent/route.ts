import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/sessions/recent — gets recent sessions for the logged-in athlete
export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = (session.user as any).id;

    // Get athlete profile for this user
    const athlete = await prisma.athleteProfile.findUnique({ where: { userId } });

    if (!athlete) {
        // Coach/admin: return last 5 sessions from any active plan
        const sessions = await prisma.trainingSession.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: {
                mesocycle: {
                    include: { plan: { include: { athlete: { select: { id: true, fullName: true } }, coach: { select: { name: true } } } } },
                },
                exercises: {
                    orderBy: { orderIndex: 'asc' },
                    include: { exercise: true, loadLogs: { orderBy: { date: 'desc' }, take: 1 } },
                },
            },
        });
        return NextResponse.json(sessions);
    }

    // Athlete: get sessions from their active plans
    const plans = await prisma.trainingPlan.findMany({
        where: { athleteId: athlete.id, status: 'active' },
        include: {
            mesocycles: {
                include: {
                    sessions: {
                        orderBy: { weekNumber: 'asc' },
                        take: 3,
                        include: {
                            exercises: {
                                orderBy: { orderIndex: 'asc' },
                                include: { exercise: true, loadLogs: { orderBy: { date: 'desc' }, take: 1 } },
                            },
                        },
                    },
                },
                orderBy: { orderIndex: 'asc' },
                take: 1,
            },
        },
    });

    const sessions = plans.flatMap(p =>
        p.mesocycles.flatMap(m =>
            m.sessions.map(s => ({
                ...s,
                mesocycle: {
                    ...m,
                    plan: { ...p, athlete: { id: athlete.id, fullName: athlete.fullName } },
                },
            }))
        )
    );

    return NextResponse.json(sessions.slice(0, 5));
}
