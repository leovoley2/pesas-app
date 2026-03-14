'use client';
import { Printer } from 'lucide-react';
import { useEffect } from 'react';

export default function PrintButton() {
    // Optional: Auto-open print dialog when ready (with slight delay for images)
    useEffect(() => {
        const timer = setTimeout(() => {
            // window.print(); // uncomment to auto-print when page loads
        }, 1000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg font-bold text-sm hover:bg-gray-800 transition-colors shadow-md"
        >
            <Printer size={16} /> Imprimir / Guardar como PDF
        </button>
    );
}
