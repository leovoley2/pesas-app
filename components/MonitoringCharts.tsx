'use client';
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Legend
} from 'recharts';

interface WeeklyMetric {
    week: string;
    volume: number;
    avgRpe: number | null;
    avgReadiness: number | null;
}

interface MonitoringChartsProps {
    weeklyMetrics: WeeklyMetric[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="glass rounded-lg p-3 text-xs border border-white/15 shadow-xl">
                <p className="text-gray-300 mb-2 font-medium">{label}</p>
                {payload.map((p: any) => (
                    <p key={p.name} style={{ color: p.color }} className="font-semibold">
                        {p.name}: {p.value?.toLocaleString()}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

export default function MonitoringCharts({ weeklyMetrics }: MonitoringChartsProps) {
    const formatted = weeklyMetrics.map(w => ({
        ...w,
        week: new Date(w.week).toLocaleDateString('es-PE', { month: 'short', day: 'numeric' }),
    }));

    return (
        <div className="space-y-6">
            {/* Volume Chart */}
            <div className="glass rounded-2xl p-6">
                <h3 className="text-base font-semibold text-white mb-5">Volumen Semanal (kg · reps)</h3>
                <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={formatted} margin={{ left: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" />
                        <XAxis dataKey="week" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="volume" name="Volumen" fill="#ffc107" radius={[6, 6, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* RPE + Readiness Chart */}
            <div className="glass rounded-2xl p-6">
                <h3 className="text-base font-semibold text-white mb-5">RPE Promedio vs Readiness (1–10)</h3>
                <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={formatted} margin={{ left: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" />
                        <XAxis dataKey="week" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis domain={[0, 10]} tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ color: '#9ca3af', fontSize: 12 }} />
                        <Line type="monotone" dataKey="avgRpe" name="RPE Promedio" stroke="#fb923c" strokeWidth={2} dot={{ fill: '#fb923c', r: 4 }} />
                        <Line type="monotone" dataKey="avgReadiness" name="Readiness" stroke="#6ee7b7" strokeWidth={2} dot={{ fill: '#6ee7b7', r: 4 }} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
