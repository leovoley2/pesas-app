import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { detectOverreaching } from '@/lib/atr-engine';

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const athleteId = searchParams.get('athleteId');

    // Last 8 weeks of data
    const since = new Date();
    since.setDate(since.getDate() - 56);

    const logs = await prisma.loadLog.findMany({
        where: { ...(athleteId ? { athleteId } : {}), date: { gte: since } },
        include: { sessionExercise: { include: { exercise: true } }, athlete: { select: { fullName: true, category: true } } },
        orderBy: { date: 'asc' },
    });

    // Group by week
    const weeklyData: Record<string, { volume: number; rpeSum: number; rpeCount: number; readinessSum: number; readinessCount: number }> = {};

    for (const log of logs) {
        const date = new Date(log.date);
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        const key = weekStart.toISOString().split('T')[0];

        if (!weeklyData[key]) weeklyData[key] = { volume: 0, rpeSum: 0, rpeCount: 0, readinessSum: 0, readinessCount: 0 };

        if (log.actualLoadKg && log.actualSets) {
            const reps = log.actualReps ? (JSON.parse(log.actualReps) as number[]).reduce((a, b) => a + b, 0) : log.actualSets * 6;
            weeklyData[key].volume += log.actualLoadKg * reps;
        }
        if (log.rpeActual) { weeklyData[key].rpeSum += log.rpeActual; weeklyData[key].rpeCount++; }
        if (log.readinessScore) { weeklyData[key].readinessSum += log.readinessScore; weeklyData[key].readinessCount++; }
    }

    const weeklyMetrics = Object.entries(weeklyData).map(([week, data]) => ({
        week,
        volume: Math.round(data.volume),
        avgRpe: data.rpeCount > 0 ? parseFloat((data.rpeSum / data.rpeCount).toFixed(1)) : null,
        avgReadiness: data.readinessCount > 0 ? parseFloat((data.readinessSum / data.readinessCount).toFixed(1)) : null,
    }));

    // Detect overreaching
    const recentLogs = logs.map(l => ({ rpeActual: l.rpeActual, date: l.date }));
    const overreachingAlert = detectOverreaching(recentLogs);

    return NextResponse.json({ weeklyMetrics, overreachingAlert, totalLogs: logs.length });
}
