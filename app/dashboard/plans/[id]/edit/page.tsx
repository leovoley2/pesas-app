'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Trash2, Loader2, AlertTriangle, Settings2 } from 'lucide-react';

export default function EditPlanPage() {
    const router = useRouter();
    const params = useParams();
    const planId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const [form, setForm] = useState({
        name: '',
        description: '',
        status: 'draft',
        startDate: '',
        endDate: '',
        competitionDate: '',
    });

    const fetchPlan = useCallback(async () => {
        try {
            const res = await fetch(`/api/plans/${planId}`);
            if (!res.ok) throw new Error('Plan no encontrado');
            const data = await res.json();

            setForm({
                name: data.name,
                description: data.description || '',
                status: data.status,
                startDate: data.startDate ? data.startDate.split('T')[0] : '',
                endDate: data.endDate ? data.endDate.split('T')[0] : '',
                competitionDate: data.competitionDate ? data.competitionDate.split('T')[0] : '',
            });

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [planId]);

    useEffect(() => {
        fetchPlan();
    }, [fetchPlan]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');

        try {
            const res = await fetch(`/api/plans/${planId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: form.name,
                    description: form.description,
                    status: form.status,
                    startDate: form.startDate || undefined,
                    endDate: form.endDate || undefined,
                    competitionDate: form.competitionDate || undefined,
                }),
            });

            if (!res.ok) throw new Error('Error al actualizar el plan');

            router.push(`/dashboard/plans/${planId}`);
            router.refresh();
        } catch (err: any) {
            setError(err.message || 'Ocurrió un error inesperado');
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            const res = await fetch(`/api/plans/${planId}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Error al eliminar');
            router.push('/dashboard/plans');
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
                <Link href={`/dashboard/plans/${planId}`} className="btn-ghost p-2">
                    <ArrowLeft size={18} />
                </Link>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Settings2 size={24} className="text-brand-400" /> Configuración del Plan
                    </h1>
                    <p className="text-gray-400 text-sm mt-0.5">Editar metadatos, estado y fechas objetivo.</p>
                </div>
                <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="p-2 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Eliminar Plan"
                >
                    <Trash2 size={20} />
                </button>
            </div>

            {showDeleteConfirm && (
                <div className="glass rounded-2xl p-6 border-red-500/30 space-y-4">
                    <div className="flex items-center gap-3 text-red-400">
                        <AlertTriangle size={24} />
                        <h3 className="font-semibold text-white">Eliminar Plan permanentemente</h3>
                    </div>
                    <p className="text-sm text-gray-400">
                        Esta acción no se puede deshacer. Se eliminarán permanentemente todos los mesociclos, rutinas (sesiones y ejercicios) asociados a este plan.
                    </p>
                    <div className="flex items-center gap-3 pt-2">
                        <button onClick={() => setShowDeleteConfirm(false)} className="btn-ghost px-4 py-2 text-sm flex-1">
                            Cancelar
                        </button>
                        <button onClick={handleDelete} disabled={deleting} className="btn-brand bg-red-500 hover:bg-red-600 border-red-400 px-4 py-2 text-sm flex-1 flex justify-center items-center gap-2">
                            {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                            Sí, Eliminar Plan Completo
                        </button>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
                {error && <div className="p-4 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-sm">{error}</div>}

                {/* Plan Metadata */}
                <div className="glass rounded-2xl p-6 space-y-4">
                    <h2 className="text-base font-semibold text-white border-b border-white/8 pb-3">General</h2>

                    <div>
                        <label className="block text-sm text-gray-400 mb-1.5 font-medium">Nombre del plan *</label>
                        <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input-field" />
                    </div>

                    <div>
                        <label className="block text-sm text-gray-400 mb-1.5 font-medium">Descripción</label>
                        <textarea rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="input-field resize-none" />
                    </div>

                    <div>
                        <label className="block text-sm text-gray-400 mb-1.5 font-medium">Estado del Plan *</label>
                        <div className="grid grid-cols-3 gap-3">
                            {['draft', 'active', 'completed'].map(status => (
                                <button key={status} type="button" onClick={() => setForm(f => ({ ...f, status }))}
                                    className={`px-3 py-2.5 rounded-xl border text-sm font-medium transition-all text-center uppercase tracking-wider ${form.status === status
                                            ? status === 'active' ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                                                : status === 'completed' ? 'bg-blue-500/15 border-blue-500/40 text-blue-300'
                                                    : 'bg-gray-500/30 border-gray-500/50 text-white'
                                            : 'border-white/10 text-gray-400 hover:border-white/20'
                                        }`}>
                                    {status === 'draft' ? 'Borrador' : status === 'active' ? 'Activo' : 'Completado'}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Timeline */}
                <div className="glass rounded-2xl p-6 space-y-4">
                    <h2 className="text-base font-semibold text-white border-b border-white/8 pb-3">Línea de Tiempo & Fechas</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-sm text-gray-400 mb-1.5 font-medium">🏆 Fecha Objetivo (Competencia Principal)</label>
                            <input type="date" value={form.competitionDate} onChange={e => setForm(f => ({ ...f, competitionDate: e.target.value }))} className="input-field border-brand-500/30 focus:border-brand-500" />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1.5 font-medium">Fecha de Inicio *</label>
                            <input required type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} className="input-field" />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1.5 font-medium">Fecha de Fin (Aprox)</label>
                            <input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} className="input-field" />
                        </div>
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
