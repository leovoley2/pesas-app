'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Trash2, Loader2, AlertTriangle } from 'lucide-react';

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

export default function EditAthletePage() {
    const router = useRouter();
    const params = useParams();
    const athleteId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const [form, setForm] = useState({
        fullName: '',
        gender: 'female',
        category: 'U21',
        position: 'attacker',
        bodyWeightKg: 65,
        birthDate: '',
        notes: '',
    });

    const [oneRm, setOneRm] = useState<Record<string, string>>({
        squat: '', deadlift: '', bench_press: '', overhead_press: '', hang_clean: '',
    });

    const fetchAthlete = useCallback(async () => {
        try {
            const res = await fetch(`/api/athletes/${athleteId}`);
            if (!res.ok) throw new Error('Atleta no encontrado');
            const data = await res.json();

            setForm({
                fullName: data.fullName,
                gender: data.gender,
                category: data.category,
                position: data.position,
                bodyWeightKg: data.bodyWeightKg,
                birthDate: data.birthDate ? data.birthDate.split('T')[0] : '',
                notes: data.notes || '',
            });

            if (data.oneRmRecords) {
                const parsed1RM = JSON.parse(data.oneRmRecords);
                const rmStr: Record<string, string> = {};
                for (const key in parsed1RM) rmStr[key] = parsed1RM[key].toString();
                setOneRm(prev => ({ ...prev, ...rmStr }));
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [athleteId]);

    useEffect(() => {
        fetchAthlete();
    }, [fetchAthlete]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');

        try {
            const oneRmRecords: Record<string, number> = {};
            for (const [key, val] of Object.entries(oneRm)) {
                if (val && parseFloat(val) > 0) oneRmRecords[key] = parseFloat(val);
            }

            const res = await fetch(`/api/athletes/${athleteId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...form,
                    birthDate: form.birthDate || undefined,
                    oneRmRecords: Object.keys(oneRmRecords).length > 0 ? oneRmRecords : undefined,
                }),
            });

            if (!res.ok) throw new Error('Error al actualizar el atleta');

            router.push('/dashboard/athletes');
            router.refresh();
        } catch (err: any) {
            setError(err.message || 'Ocurrió un error inesperado');
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            const res = await fetch(`/api/athletes/${athleteId}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Error al eliminar');
            router.push('/dashboard/athletes');
            router.refresh();
        } catch (err: any) {
            setError(err.message);
            setDeleting(false);
        }
    };

    if (loading) return (
        <div className="flex justify-center py-20">
            <Loader2 size={32} className="animate-spin text-brand-400" />
        </div>
    );

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-3">
                <Link href="/dashboard/athletes" className="btn-ghost p-2">
                    <ArrowLeft size={18} />
                </Link>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        {form.fullName}
                    </h1>
                    <p className="text-gray-400 text-sm mt-0.5">Editar perfil de atleta</p>
                </div>
                <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="p-2 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors"
                >
                    <Trash2 size={20} />
                </button>
            </div>

            {showDeleteConfirm && (
                <div className="glass rounded-2xl p-6 border-red-500/30 space-y-4">
                    <div className="flex items-center gap-3 text-red-400">
                        <AlertTriangle size={24} />
                        <h3 className="font-semibold text-white">Eliminar Atleta permanentemente</h3>
                    </div>
                    <p className="text-sm text-gray-400">
                        Esta acción no se puede deshacer. Se eliminarán permanentemente el atleta,
                        sus planes de entrenamiento, mesociclos, rutinas y registros de carga (Load Logs).
                    </p>
                    <div className="flex items-center gap-3 pt-2">
                        <button onClick={() => setShowDeleteConfirm(false)} className="btn-ghost px-4 py-2 text-sm flex-1">
                            Cancelar
                        </button>
                        <button onClick={handleDelete} disabled={deleting} className="btn-brand bg-red-500 hover:bg-red-600 border-red-400 px-4 py-2 text-sm flex-1 flex justify-center items-center gap-2">
                            {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                            Sí, Eliminar Todo
                        </button>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
                {error && <div className="p-4 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-sm">{error}</div>}

                {/* Personal info */}
                <div className="glass rounded-2xl p-6 space-y-4">
                    <h2 className="text-base font-semibold text-white border-b border-white/8 pb-3">👤 Información Personal</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-sm text-gray-400 mb-1.5 font-medium">Nombre completo *</label>
                            <input id="fullName" required value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} className="input-field" />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1.5 font-medium">Fecha de Nacimiento</label>
                            <input type="date" value={form.birthDate} onChange={e => setForm(f => ({ ...f, birthDate: e.target.value }))} className="input-field" />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1.5 font-medium">Peso Corporal (kg)</label>
                            <input type="number" min={30} max={150} step={0.5} value={form.bodyWeightKg} onChange={e => setForm(f => ({ ...f, bodyWeightKg: parseFloat(e.target.value) }))} className="input-field" />
                        </div>
                    </div>
                </div>

                {/* Sport info */}
                <div className="glass rounded-2xl p-6 space-y-4">
                    <h2 className="text-base font-semibold text-white border-b border-white/8 pb-3">🏐 Perfil Deportivo</h2>
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm text-gray-400 mb-2 font-medium">Género</label>
                            <div className="flex flex-col gap-2">
                                {GENDERS.map(g => (
                                    <button key={g.val} type="button" onClick={() => setForm(f => ({ ...f, gender: g.val }))} className={`px-3 py-2.5 rounded-xl border text-sm font-medium transition-all text-left ${form.gender === g.val ? 'bg-brand-500/15 border-brand-500/40 text-brand-300' : 'border-white/10 text-gray-400'}`}>{g.label}</button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-2 font-medium">Categoría</label>
                            <div className="flex flex-col gap-2">
                                {CATEGORIES.map(c => (
                                    <button key={c} type="button" onClick={() => setForm(f => ({ ...f, category: c }))} className={`px-3 py-2.5 rounded-xl border text-sm font-medium transition-all text-left ${form.category === c ? 'bg-brand-500/15 border-brand-500/40 text-brand-300' : 'border-white/10 text-gray-400'}`}>{categoryLabel[c]}</button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-2 font-medium">Posición</label>
                            <div className="flex flex-col gap-2">
                                {POSITIONS.map(p => (
                                    <button key={p.val} type="button" onClick={() => setForm(f => ({ ...f, position: p.val }))} className={`px-3 py-2.5 rounded-xl border text-sm font-medium transition-all text-left ${form.position === p.val ? 'bg-brand-500/15 border-brand-500/40 text-brand-300' : 'border-white/10 text-gray-400'}`}>{p.label}</button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Notes */}
                <div className="glass rounded-2xl p-6 space-y-4">
                    <h2 className="text-base font-semibold text-white border-b border-white/8 pb-3">📝 Notas Médicas / Entrenador</h2>
                    <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="input-field min-h-[100px] w-full" placeholder="Lesiones previas, consideraciones, etc..." />
                </div>

                {/* 1RM Records */}
                <div className="glass rounded-2xl p-6 space-y-4">
                    <h2 className="text-base font-semibold text-white border-b border-white/8 pb-3">💪 Registros 1RM</h2>
                    <div className="grid grid-cols-2 gap-4">
                        {KEY_EXERCISES.map(ex => (
                            <div key={ex.key}>
                                <label className="block text-sm text-gray-400 mb-1.5 font-medium">{ex.label} <span className="text-gray-600">(kg)</span></label>
                                <input type="number" min={0} max={500} step={2.5} value={oneRm[ex.key]} onChange={e => setOneRm(r => ({ ...r, [ex.key]: e.target.value }))} className="input-field" placeholder="0" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Submit */}
                <button type="submit" disabled={saving || deleting} className="btn-brand w-full flex items-center justify-center gap-2 py-3 text-base disabled:opacity-60">
                    {saving ? <><Loader2 size={18} className="animate-spin" /> Guardando...</> : <><Save size={18} /> Guardar Cambios</>}
                </button>
            </form>
        </div>
    );
}
