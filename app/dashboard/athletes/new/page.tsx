'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, UserPlus, Save, Loader2 } from 'lucide-react';

const CATEGORIES = ['U18', 'U19', 'U21', 'adult'] as const;
const GENDERS = [{ val: 'female', label: '♀ Femenino' }, { val: 'male', label: '♂ Masculino' }] as const;
const POSITIONS = [{ val: 'attacker', label: '⚡ Atacante' }, { val: 'defender', label: '🛡️ Defensor/Líbero' }] as const;

const KEY_EXERCISES = [
    { key: 'squat', label: 'Sentadilla' },
    { key: 'deadlift', label: 'Peso Muerto' },
    { key: 'bench_press', label: 'Press de Banca' },
    { key: 'overhead_press', label: 'Press Militar' },
    { key: 'hang_clean', label: 'Colgada de Potencia' },
];

const categoryLabel: Record<string, string> = { U18: 'Sub-18', U19: 'Sub-19', U21: 'Sub-21', adult: 'Adulto' };

export default function NewAthletePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [form, setForm] = useState({
        fullName: '',
        email: '',
        password: '',
        gender: 'female',
        category: 'U21',
        position: 'attacker',
        bodyWeightKg: 65,
        birthDate: '',
    });

    const [oneRm, setOneRm] = useState<Record<string, string>>({
        squat: '', deadlift: '', bench_press: '', overhead_press: '', hang_clean: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // 1. Create user account
            const userRes = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: form.fullName, email: form.email, password: form.password, role: 'athlete' }),
            });

            if (!userRes.ok) {
                const data = await userRes.json();
                throw new Error(data.error || 'Error al crear el usuario');
            }

            const user = await userRes.json();

            // 2. Build 1RM records (only non-empty)
            const oneRmRecords: Record<string, number> = {};
            for (const [key, val] of Object.entries(oneRm)) {
                if (val && parseFloat(val) > 0) oneRmRecords[key] = parseFloat(val);
            }

            // 3. Create athlete profile
            const athleteRes = await fetch('/api/athletes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    fullName: form.fullName,
                    gender: form.gender,
                    category: form.category,
                    position: form.position,
                    bodyWeightKg: form.bodyWeightKg,
                    birthDate: form.birthDate || undefined,
                    oneRmRecords: Object.keys(oneRmRecords).length > 0 ? JSON.stringify(oneRmRecords) : undefined,
                }),
            });

            if (!athleteRes.ok) throw new Error('Error al crear el perfil del atleta');

            router.push('/dashboard/athletes');
            router.refresh();
        } catch (err: any) {
            setError(err.message || 'Ocurrió un error inesperado');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Link href="/dashboard/athletes" className="btn-ghost p-2">
                    <ArrowLeft size={18} />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <UserPlus size={22} className="text-brand-400" /> Nuevo Atleta
                    </h1>
                    <p className="text-gray-400 text-sm mt-0.5">Crea un perfil de atleta para el programa ATR</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                    <div className="p-4 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-sm">{error}</div>
                )}

                {/* Personal info */}
                <div className="glass rounded-2xl p-6 space-y-4">
                    <h2 className="text-base font-semibold text-white border-b border-white/8 pb-3">👤 Información Personal</h2>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-sm text-gray-400 mb-1.5 font-medium">Nombre completo *</label>
                            <input id="fullName" required value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
                                className="input-field" placeholder="Ej: María López Quispe" />
                        </div>

                        <div>
                            <label className="block text-sm text-gray-400 mb-1.5 font-medium">Email (para login) *</label>
                            <input id="email" type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                                className="input-field" placeholder="atleta@email.com" />
                        </div>

                        <div>
                            <label className="block text-sm text-gray-400 mb-1.5 font-medium">Contraseña inicial *</label>
                            <input id="password" type="password" required minLength={6} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                                className="input-field" placeholder="Mínimo 6 caracteres" />
                        </div>

                        <div>
                            <label className="block text-sm text-gray-400 mb-1.5 font-medium">Fecha de Nacimiento</label>
                            <input type="date" value={form.birthDate} onChange={e => setForm(f => ({ ...f, birthDate: e.target.value }))}
                                className="input-field" />
                        </div>

                        <div>
                            <label className="block text-sm text-gray-400 mb-1.5 font-medium">Peso Corporal (kg)</label>
                            <input type="number" min={30} max={150} step={0.5} value={form.bodyWeightKg} onChange={e => setForm(f => ({ ...f, bodyWeightKg: parseFloat(e.target.value) }))}
                                className="input-field" />
                        </div>
                    </div>
                </div>

                {/* Sport info */}
                <div className="glass rounded-2xl p-6 space-y-4">
                    <h2 className="text-base font-semibold text-white border-b border-white/8 pb-3">🏐 Perfil Deportivo</h2>

                    <div className="grid grid-cols-3 gap-4">
                        {/* Gender */}
                        <div>
                            <label className="block text-sm text-gray-400 mb-2 font-medium">Género</label>
                            <div className="flex flex-col gap-2">
                                {GENDERS.map(g => (
                                    <button key={g.val} type="button" onClick={() => setForm(f => ({ ...f, gender: g.val }))}
                                        className={`px-3 py-2.5 rounded-xl border text-sm font-medium transition-all text-left ${form.gender === g.val ? 'bg-brand-500/15 border-brand-500/40 text-brand-300' : 'border-white/10 text-gray-400 hover:border-white/20'}`}>
                                        {g.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Category */}
                        <div>
                            <label className="block text-sm text-gray-400 mb-2 font-medium">Categoría</label>
                            <div className="flex flex-col gap-2">
                                {CATEGORIES.map(c => (
                                    <button key={c} type="button" onClick={() => setForm(f => ({ ...f, category: c }))}
                                        className={`px-3 py-2.5 rounded-xl border text-sm font-medium transition-all text-left ${form.category === c ? 'bg-brand-500/15 border-brand-500/40 text-brand-300' : 'border-white/10 text-gray-400 hover:border-white/20'}`}>
                                        {categoryLabel[c]}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Position */}
                        <div>
                            <label className="block text-sm text-gray-400 mb-2 font-medium">Posición</label>
                            <div className="flex flex-col gap-2">
                                {POSITIONS.map(p => (
                                    <button key={p.val} type="button" onClick={() => setForm(f => ({ ...f, position: p.val }))}
                                        className={`px-3 py-2.5 rounded-xl border text-sm font-medium transition-all text-left ${form.position === p.val ? 'bg-brand-500/15 border-brand-500/40 text-brand-300' : 'border-white/10 text-gray-400 hover:border-white/20'}`}>
                                        {p.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 1RM Records */}
                <div className="glass rounded-2xl p-6 space-y-4">
                    <div>
                        <h2 className="text-base font-semibold text-white">💪 Registros 1RM Iniciales</h2>
                        <p className="text-xs text-gray-500 mt-1">Opcional — se usa para calcular las cargas automáticamente. Puedes completarlo después.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        {KEY_EXERCISES.map(ex => (
                            <div key={ex.key}>
                                <label className="block text-sm text-gray-400 mb-1.5 font-medium">{ex.label} <span className="text-gray-600">(kg)</span></label>
                                <input type="number" min={0} max={500} step={2.5} value={oneRm[ex.key]} onChange={e => setOneRm(r => ({ ...r, [ex.key]: e.target.value }))}
                                    className="input-field" placeholder="0" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Submit */}
                <button id="btn-create-athlete" type="submit" disabled={loading}
                    className="btn-brand w-full flex items-center justify-center gap-2 py-3 text-base disabled:opacity-60">
                    {loading ? <><Loader2 size={18} className="animate-spin" /> Creando atleta...</> : <><Save size={18} /> Crear Atleta</>}
                </button>
            </form>
        </div>
    );
}
