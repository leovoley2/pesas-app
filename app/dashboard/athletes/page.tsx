import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { ArrowRight, UserPlus, Edit2, Trash2 } from 'lucide-react';
import { getCategoryLabel, getGenderLabel } from '@/lib/utils';
import { auth } from '@/lib/auth';

export default async function AthletesPage() {
    const session = await auth();
    const isAdmin = ['admin', 'coach'].includes((session?.user as any)?.role || '');

    const athletes = await prisma.athleteProfile.findMany({
        include: {
            user: { select: { email: true } },
            plans: { where: { status: { in: ['draft', 'active'] } }, select: { id: true, name: true, status: true } },
            _count: { select: { loadLogs: true } },
        },
        orderBy: { fullName: 'asc' },
    });

    const categoryColors: Record<string, string> = {
        U18: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
        U19: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
        U21: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
        adult: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Atletas</h1>
                    <p className="text-gray-400 mt-1">{athletes.length} atletas registrados</p>
                </div>
                {isAdmin && (
                    <Link href="/dashboard/athletes/new" className="btn-brand flex items-center gap-2">
                        <UserPlus size={16} />
                        Nuevo Atleta
                    </Link>
                )}
            </div>

            {athletes.length === 0 ? (
                <div className="glass rounded-2xl p-16 text-center">
                    <p className="text-5xl mb-4">🏐</p>
                    <p className="text-gray-300 font-semibold text-lg">Sin atletas registrados</p>
                    <p className="text-gray-500 text-sm mt-2">Crea el primer perfil de atleta para comenzar</p>
                    {isAdmin && (
                        <Link href="/dashboard/athletes/new" className="btn-brand inline-flex items-center gap-2 mt-6">
                            <UserPlus size={16} /> Crear Atleta
                        </Link>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {athletes.map(athlete => {
                        const oneRm = (() => { try { return JSON.parse(athlete.oneRmRecords || '{}') as Record<string, number>; } catch { return {}; } })();
                        return (
                            <div key={athlete.id} className="glass rounded-2xl p-5 group flex flex-col relative">
                                <Link href={`/dashboard/athletes/${athlete.id}`} className="absolute inset-0 z-0" />

                                <div className="flex items-start gap-3 mb-4 relative z-10">
                                    <div className="w-11 h-11 bg-gradient-to-br from-brand-500/30 to-blue-500/30 rounded-full flex items-center justify-center text-xl flex-shrink-0 border border-white/10">
                                        {athlete.gender === 'female' ? '👩' : '👨'}
                                    </div>
                                    <div className="flex-1 min-w-0 pointer-events-none">
                                        <p className="font-semibold text-white truncate group-hover:text-brand-400 transition-colors">{athlete.fullName}</p>
                                        <p className="text-xs text-gray-400">{athlete.user.email}</p>
                                    </div>
                                    {isAdmin && (
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Link href={`/dashboard/athletes/${athlete.id}/edit`} className="p-1.5 rounded-lg bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all pointer-events-auto">
                                                <Edit2 size={14} />
                                            </Link>
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-wrap gap-2 mb-4 pointer-events-none">
                                    <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${categoryColors[athlete.category] || categoryColors.adult}`}>
                                        {getCategoryLabel(athlete.category)}
                                    </span>
                                    <span className="text-xs px-2.5 py-1 rounded-full border border-white/10 bg-white/5 text-gray-300">
                                        {getGenderLabel(athlete.gender)}
                                    </span>
                                    <span className="text-xs px-2.5 py-1 rounded-full border border-white/10 bg-white/5 text-gray-300">
                                        {athlete.bodyWeightKg}kg - {athlete.position === 'defender' ? 'Zaguero/Defensor' : 'Bloqueador/Atacante'}
                                    </span>
                                </div>

                                {/* 1RM preview */}
                                {Object.keys(oneRm).length > 0 && (
                                    <div className="grid grid-cols-2 gap-2 mt-auto pointer-events-none">
                                        {Object.entries(oneRm).slice(0, 2).map(([key, val]) => (
                                            <div key={key} className="bg-white/5 rounded-lg p-2 text-center">
                                                <p className="text-brand-400 font-bold text-sm">{val}kg</p>
                                                <p className="text-xs text-gray-500 capitalize">{key.replace(/_/g, ' ')}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/8 pointer-events-none">
                                    <span className="text-xs text-gray-500">{athlete._count.loadLogs} sesiones logeadas</span>
                                    {athlete.plans.length > 0 ? (
                                        <span className={`text-xs ${athlete.plans.some((p: any) => p.status === 'active') ? 'text-brand-400' : 'text-amber-400'}`}>
                                            {athlete.plans.length} plan{athlete.plans.length > 1 ? 'es' : ''} {athlete.plans.some((p: any) => p.status === 'active') ? 'activo(s)' : 'en borrador'}
                                        </span>
                                    ) : (
                                        <span className="text-xs text-gray-500">Sin planes</span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
