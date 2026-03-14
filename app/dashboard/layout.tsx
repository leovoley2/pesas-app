import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    const session = await auth();
    if (!session) redirect('/login');

    return (
        <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 ml-60 p-8 min-h-screen">
                <div className="max-w-7xl mx-auto animate-fade-in">
                    {children}
                </div>
            </main>
        </div>
    );
}
