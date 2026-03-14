'use client';
import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';

interface SessionPDFButtonProps {
    session: {
        id: string;
        weekNumber: number;
        dayOfWeek: string;
        mesocycle: {
            atrPhase: string;
            plan: { name: string };
        };
        exercises: Array<{
            exercise: { name: string; imageUrl: string | null; muscleGroups: string };
            sets: number;
            repsScheme: string;
            loadKg: number | null;
            intensityPctRm: number | null;
            tempo: string | null;
            rpeTarget: number | null;
            restSeconds: number;
            notes: string | null;
        }>;
    };
    athlete: {
        fullName: string;
        category: string;
        gender: string;
    };
}

const phaseLabel: Record<string, string> = {
    accumulation: 'Acumulación',
    transformation: 'Transformación',
    realization: 'Realización',
};
const dayLabel: Record<string, string> = {
    monday: 'Lunes', tuesday: 'Martes', wednesday: 'Miércoles',
    thursday: 'Jueves', friday: 'Viernes', saturday: 'Sábado', sunday: 'Domingo',
};
const phaseColorRgb: Record<string, [number, number, number]> = {
    accumulation: [59, 130, 246],
    transformation: [245, 158, 11],
    realization: [16, 185, 129],
};

/** Convert an image URL (local /exercises/*.jpg) to a base64 data URL */
async function imageToBase64(url: string): Promise<string | null> {
    try {
        const res = await fetch(url);
        if (!res.ok) return null;
        const blob = await res.blob();
        return new Promise(resolve => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(blob);
        });
    } catch {
        return null;
    }
}

export default function SessionPDFButton({ session, athlete }: SessionPDFButtonProps) {
    const [loading, setLoading] = useState(false);

    const generatePDF = async () => {
        setLoading(true);
        try {
            const { default: jsPDF } = await import('jspdf');
            const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

            const pageW = 210;
            const margin = 14;
            const phaseRgb = phaseColorRgb[session.mesocycle.atrPhase] ?? [255, 193, 7];

            // ── Cover Header ──
            // Dark navy background
            doc.setFillColor(10, 13, 61);
            doc.rect(0, 0, pageW, 44, 'F');
            // Phase color accent strip
            doc.setFillColor(...phaseRgb);
            doc.rect(0, 44, pageW, 3, 'F');
            // Brand side bar
            doc.setFillColor(255, 193, 7);
            doc.rect(0, 0, 5, 44, 'F');

            // Title
            doc.setTextColor(255, 193, 7);
            doc.setFontSize(20);
            doc.setFont('helvetica', 'bold');
            doc.text('VB FUERZA', margin + 4, 14);

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(11);
            doc.text(session.mesocycle.plan.name, margin + 4, 23);

            doc.setTextColor(200, 210, 255);
            doc.setFontSize(9);
            doc.text(`${athlete.fullName}  ·  ${athlete.category} ${athlete.gender === 'female' ? '♀' : '♂'}  ·  Entrenador VB Fuerza`, margin + 4, 30);

            // Phase + date badge
            doc.setFillColor(...phaseRgb, 40);
            doc.setTextColor(...phaseRgb);
            doc.setFontSize(8.5);
            doc.setFont('helvetica', 'bold');
            const phaseText = `${phaseLabel[session.mesocycle.atrPhase]}  ·  Semana ${session.weekNumber}  ·  ${dayLabel[session.dayOfWeek]}`;
            doc.text(phaseText, margin + 4, 39);

            const dateStr = new Date().toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' });
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(150, 160, 200);
            doc.setFontSize(7.5);
            doc.text(dateStr, pageW - margin, 39, { align: 'right' });

            let y = 54;

            // ── Exercises ──
            for (let i = 0; i < session.exercises.length; i++) {
                const ex = session.exercises[i];
                const imgH = 34;
                const rowH = imgH + 4;

                if (y + rowH > 278) {
                    doc.addPage();
                    // mini header on subsequent pages
                    doc.setFillColor(10, 13, 61);
                    doc.rect(0, 0, pageW, 12, 'F');
                    doc.setFillColor(255, 193, 7);
                    doc.rect(0, 0, 4, 12, 'F');
                    doc.setTextColor(255, 193, 7);
                    doc.setFontSize(8);
                    doc.setFont('helvetica', 'bold');
                    doc.text('VB FUERZA  ·  ' + phaseLabel[session.mesocycle.atrPhase].toUpperCase(), margin + 4, 8);
                    y = 20;
                }

                // Card background
                const isEven = i % 2 === 0;
                doc.setFillColor(isEven ? 18 : 14, isEven ? 22 : 18, isEven ? 80 : 68);
                doc.roundedRect(margin, y, pageW - margin * 2, rowH, 4, 4, 'F');

                // Exercise number badge
                doc.setFillColor(255, 193, 7);
                doc.circle(margin + 9, y + 8, 5, 'F');
                doc.setTextColor(10, 13, 61);
                doc.setFontSize(9);
                doc.setFont('helvetica', 'bold');
                doc.text(String(i + 1), margin + 9, y + 8 + 0.5, { align: 'center', baseline: 'middle' });

                // Exercise image (if available)
                const imgX = margin + 2;
                const imgY = y + rowH / 2 - imgH / 2;
                const imgW = imgH; // square
                let imgLoaded = false;

                if (ex.exercise.imageUrl) {
                    try {
                        const b64 = await imageToBase64(ex.exercise.imageUrl);
                        if (b64) {
                            doc.addImage(b64, 'JPEG', imgX, imgY, imgW, imgH);
                            // Rounded overlay clip illusion (border)
                            doc.setDrawColor(255, 193, 7);
                            doc.setLineWidth(0.5);
                            doc.roundedRect(imgX, imgY, imgW, imgH, 3, 3, 'S');
                            imgLoaded = true;
                        }
                    } catch { /* fallback */ }
                }

                if (!imgLoaded) {
                    doc.setFillColor(30, 35, 100);
                    doc.roundedRect(imgX, imgY, imgW, imgH, 3, 3, 'F');
                    doc.setTextColor(100, 100, 200);
                    doc.setFontSize(16);
                    doc.text('💪', imgX + imgW / 2, imgY + imgH / 2 + 2, { align: 'center' });
                }

                const textX = margin + imgW + 6;
                const contentW = pageW - margin * 2 - imgW - 6;

                // Exercise name
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(11);
                doc.setFont('helvetica', 'bold');
                doc.text(ex.exercise.name, textX, y + 9);

                // Muscle groups
                const muscles = (JSON.parse(ex.exercise.muscleGroups || '[]') as string[])
                    .slice(0, 3).map(m => m.replace(/_/g, ' ')).join('  ·  ');
                doc.setTextColor(...phaseRgb);
                doc.setFontSize(7.5);
                doc.setFont('helvetica', 'normal');
                doc.text(muscles, textX, y + 15);

                // Stats grid
                const stats = [
                    { icon: '📋', label: 'SETS × REPS', val: ex.repsScheme },
                    { icon: '⚖️', label: 'CARGA', val: ex.loadKg ? `${ex.loadKg} kg` : '—' },
                    { icon: '🎯', label: '% RM', val: ex.intensityPctRm ? `${ex.intensityPctRm}%` : '—' },
                    { icon: '⏱️', label: 'TEMPO', val: ex.tempo ?? '—' },
                    { icon: '💪', label: 'RPE OBJ.', val: ex.rpeTarget ? `${ex.rpeTarget}/10` : '—' },
                    { icon: '⏸️', label: 'DESCANSO', val: `${ex.restSeconds}s` },
                ];

                const colW = contentW / stats.length;
                stats.forEach((s, si) => {
                    const cx = textX + si * colW + colW / 2;
                    // Label
                    doc.setTextColor(80, 100, 180);
                    doc.setFontSize(5.5);
                    doc.setFont('helvetica', 'bold');
                    doc.text(s.label, cx, y + 22, { align: 'center' });
                    // Value
                    doc.setTextColor(255, 220, 80);
                    doc.setFontSize(9.5);
                    doc.text(s.val, cx, y + 28, { align: 'center' });
                });

                // Notes (if any)
                if (ex.notes) {
                    doc.setTextColor(140, 160, 200);
                    doc.setFontSize(7);
                    doc.setFont('helvetica', 'italic');
                    const notesText = doc.splitTextToSize(`📝 ${ex.notes}`, contentW);
                    doc.text(notesText[0], textX, y + 34);
                }

                y += rowH + 4;
            }

            // ── Footer ──
            const totalPages = (doc as any).internal.getNumberOfPages();
            for (let p = 1; p <= totalPages; p++) {
                doc.setPage(p);
                doc.setFillColor(8, 10, 45);
                doc.rect(0, 286, pageW, 11, 'F');
                doc.setTextColor(60, 70, 130);
                doc.setFontSize(7);
                doc.setFont('helvetica', 'normal');
                doc.text('VB Fuerza  ·  Sistema de Periodización ATR para Voleibol de Playa de Alto Rendimiento', pageW / 2, 292, { align: 'center' });
                doc.text(`Pág. ${p}/${totalPages}`, pageW - margin, 292, { align: 'right' });
            }

            const fileName = `Rutina_${athlete.fullName.replace(/\s+/g, '_')}_S${session.weekNumber}_${dayLabel[session.dayOfWeek]}.pdf`;
            doc.save(fileName);
        } catch (err) {
            console.error('PDF error:', err);
            alert('Error al generar el PDF. Verifica la consola para más detalles.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            id="btn-download-pdf"
            onClick={generatePDF}
            disabled={loading}
            className="btn-brand flex items-center gap-2 disabled:opacity-60"
        >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            {loading ? 'Generando PDF...' : 'Descargar PDF'}
        </button>
    );
}
