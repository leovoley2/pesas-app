'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
    LayoutDashboard, Users, ClipboardList, Dumbbell,
    BarChart3, LogOut, Volleyball, ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/athletes', label: 'Atletas', icon: Users },
    { href: '/dashboard/plans', label: 'Planes ATR', icon: ClipboardList },
    { href: '/dashboard/exercises', label: 'Ejercicios', icon: Dumbbell },
    { href: '/dashboard/monitoring', label: 'Monitoreo', icon: BarChart3 },
    { href: '/dashboard/load-log', label: 'Carga Diaria', icon: Volleyball },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="fixed left-0 top-0 h-screen w-60 flex flex-col glass border-r border-white/8 z-30">
            {/* Logo */}
            <div className="p-5 border-b border-white/8">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-brand-500 rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/30 flex-shrink-0">
                        <span className="text-lg">🏐</span>
                    </div>
                    <div>
                        <p className="font-bold text-white text-sm leading-tight">VB Fuerza</p>
                        <p className="text-xs text-gray-500">ATR · Alto Rendimiento</p>
                    </div>
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                {navItems.map(({ href, label, icon: Icon }) => {
                    const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={cn(
                                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group',
                                isActive
                                    ? 'bg-brand-500/15 text-brand-400 border border-brand-500/25'
                                    : 'text-gray-400 hover:text-white hover:bg-white/8 border border-transparent'
                            )}
                        >
                            <Icon size={18} className={isActive ? 'text-brand-400' : 'text-gray-500 group-hover:text-gray-300'} />
                            <span className="flex-1">{label}</span>
                            {isActive && <ChevronRight size={14} className="text-brand-400/60" />}
                        </Link>
                    );
                })}
            </nav>

            {/* Logout */}
            <div className="p-3 border-t border-white/8">
                <button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 w-full border border-transparent hover:border-red-500/20"
                >
                    <LogOut size={18} />
                    <span>Cerrar Sesión</span>
                </button>
            </div>
        </aside>
    );
}
