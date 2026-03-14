import { prisma } from '@/lib/prisma';
import MonitoringCharts from '@/components/MonitoringCharts';
import { BarChart3, AlertTriangle, TrendingUp, Activity } from 'lucide-react';

export default async function MonitoringPage() {
    const athletes = await prisma.athleteProfile.findMany({ select: { id: true, fullName: true, category: true } });

    const since = new Date();
    since.setDate(since.getDate() - 56);

    const logs = await prisma.loadLog.findMany({
        where: { date: { gte: since } },
        include: { sessionExercise: { include: { exercise: { select: { name: true } } } }, athlete: { select: { fullName: true, category: true } } },
        orderBy: { date: 'asc' },
    });

    // Group by week
    const weeklyMap = new Map<string, { volume: number; rpeSum: number; rpeCount: number; readinessSum: number; readinessCount: number }>();
    for (const log of logs) {
        const d = new Date(log.date);
        d.setDate(d.getDate() - d.getDay());
        const key = d.toISOString().split('T')[0];
        if (!weeklyMap.has(key)) weeklyMap.set(key, { volume: 0, rpeSum: 0, rpeCount: 0, readinessSum: 0, readinessCount: 0 });
        const w = weeklyMap.get(key)!;
        if (log.actualLoadKg && log.actualSets) w.volume += log.actualLoadKg * log.actualSets * 5;
        if (log.rpeActual) { w.rpeSum += log.rpeActual; w.rpeCount++; }
        if (log.readinessScore) { w.readinessSum += log.readinessScore; w.readinessCount++; }
    }

    const weeklyMetrics = Array.from(weeklyMap.entries()).map(([week, d]) => ({
        week,
        volume: Math.round(d.volume),
        avgRpe: d.rpeCount > 0 ? parseFloat((d.rpeSum / d.rpeCount).toFixed(1)) : null,
        avgReadiness: d.readinessCount > 0 ? parseFloat((d.readinessSum / d.readinessCount).toFixed(1)) : null,
    }));

    const highRpeLogs = logs.filter(l => (l.rpeActual ?? 0) >= 9);
    const avgReadinessAll = logs.filter(l => l.readinessScore).length > 0
        ? (logs.reduce((a, l) => a + (l.readinessScore ?? 0), 0) / logs.filter(l => l.readinessScore).length).toFixed(1)
        : 'N/A';

    const readinessStatus = avgReadinessAll === 'N/A' ? 'gray' : parseFloat(avgReadinessAll) >= 7 ? 'green' : parseFloat(avgReadinessAll) >= 5 ? 'yellow' : 'red';
    const statusColors: Record<string, string> = { green: 'text-emerald-400 bg-emerald-500/15', yellow: 'text-amber-400 bg-amber-500/15', red: 'text-red-400 bg-red-500/15', gray: 'text-gray-400 bg-gray-500/15' };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3"><BarChart3 size={28} className="text-brand-400" /> Monitoreo de Carga</h1>
                <p className="text-gray-400 mt-1">Últimas 8 semanas · {logs.length} registros</p>
            </div>

            {/* Summary stats */}
            <div className="grid grid-cols-4 gap-4">
                {[
                    { label: 'Registros totales', val: logs.length, icon: Activity, bg: 'bg-blue-500/15', color: 'text-blue-400' },
                    { label: 'RPE Alto (≥9)', val: highRpeLogs.length, icon: AlertTriangle, bg: 'bg-orange-500/15', color: 'text-orange-400' },
                    { label: 'Readiness Promedio', val: avgReadinessAll !== 'N/A' ? avgReadinessAll + '/10' : 'N/A', icon: TrendingUp, bg: statusColors[readinessStatus].split(' ')[1], color: statusColors[readinessStatus].split(' ')[0] },
                    { label: 'Atletas monitoreados', val: new Set(logs.map(l => l.athleteId)).size, icon: BarChart3, bg: 'bg-purple-500/15', color: 'text-purple-400' },
                ].map(({ label, val, icon: Icon, bg, color }) => (
                    <div key={label} className="glass rounded-2xl p-5">
                        <div className="flex items-start gap-3">
                            <div className={`${bg} p-2.5 rounded-xl`}><Icon size={20} className={color} /></div>
                            <div>
                                <p className={`text-2xl font-bold ${color}`}>{val}</p>
                                <p className="text-xs text-gray-400 mt-1">{label}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Readiness traffic light */}
            <div className="glass rounded-2xl p-5 flex items-center gap-6">
                <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full ${readinessStatus === 'green' ? 'bg-emerald-400 animate-pulse-glow' : readinessStatus === 'yellow' ? 'bg-amber-400' : 'bg-red-400'}`} />
                    <span className="text-sm font-medium text-white">Estado de Readiness del Equipo</span>
                </div>
                <span className={`text-sm ${statusColors[readinessStatus]}`}>
                    {readinessStatus === 'green' ? '✅ Óptimo — continuar con la carga planificada'
                        : readinessStatus === 'yellow' ? '⚠️ Moderado — monitorear de cerca'
                            : readinessStatus === 'red' ? '🔴 Bajo — considerar reducción de volumen'
                                : '⬜ Sin datos suficientes'}
                </span>
            </div>

            {logs.length === 0 ? (
                <div className="glass rounded-2xl p-16 text-center">
                    <p className="text-5xl mb-4">📊</p>
                    <p className="text-gray-300 font-semibold text-lg">Sin datos de carga aún</p>
                    <p className="text-gray-500 text-sm mt-2">Los atletas deben registrar su carga diaria para ver las gráficas</p>
                </div>
            ) : (
                <MonitoringCharts weeklyMetrics={weeklyMetrics} />
            )}
        </div>
    );
}
