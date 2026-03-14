import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
    title: 'VB Fuerza — Voleibol de Playa',
    description: 'Sistema de periodización ATR y monitoreo de carga para voleibol de playa de alto rendimiento',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="es" className="dark">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
            </head>
            <body className="bg-navy-900 text-white antialiased font-sans min-h-screen">
                {children}
            </body>
        </html>
    );
}
