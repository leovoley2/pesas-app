'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        const res = await signIn('credentials', { email, password, redirect: false });
        setLoading(false);
        if (res?.ok) router.push('/dashboard');
        else setError('Credenciales incorrectas. Verifica tu email y contraseña.');
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
            {/* Animated background */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-navy-700 via-navy-900 to-navy-900" />
            <div className="absolute inset-0">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            </div>

            <div className="relative z-10 w-full max-w-md px-6 animate-fade-in">
                {/* Logo / Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-brand-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-brand-500/30">
                        <span className="text-3xl">🏐</span>
                    </div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">VB Fuerza</h1>
                    <p className="text-gray-400 mt-2 text-sm">Periodización ATR · Voleibol de Playa de Alto Rendimiento</p>
                </div>

                {/* Card */}
                <div className="glass rounded-2xl p-8 shadow-2xl">
                    <h2 className="text-xl font-semibold text-white mb-6">Iniciar Sesión</h2>

                    {error && (
                        <div className="mb-4 p-3 rounded-lg bg-red-500/15 border border-red-500/30 text-red-300 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm text-gray-400 mb-1.5 font-medium">Email</label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="input-field"
                                placeholder="coach@vbfuerza.com"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm text-gray-400 mb-1.5 font-medium">Contraseña</label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="input-field"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <button
                            id="btn-login"
                            type="submit"
                            disabled={loading}
                            className="btn-brand w-full mt-6 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <><span className="w-4 h-4 border-2 border-navy-900/30 border-t-navy-900 rounded-full animate-spin" />Ingresando...</>
                            ) : 'Ingresar'}
                        </button>
                    </form>

                    {/* Demo credentials */}
                    <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10">
                        <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-2">Cuentas demo</p>
                        <div className="space-y-1 text-xs text-gray-400">
                            <p>🏅 <span className="text-brand-400 font-medium">Coach:</span> coach@vbfuerza.com / coach123</p>
                            <p>🏐 <span className="text-blue-400 font-medium">Atleta:</span> atleta@vbfuerza.com / atleta123</p>
                            <p>⚙️ <span className="text-purple-400 font-medium">Admin:</span> admin@vbfuerza.com / admin123</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
