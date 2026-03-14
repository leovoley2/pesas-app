import { type ClassValue, clsx } from 'clsx';

export function cn(...inputs: ClassValue[]) {
    return inputs.filter(Boolean).join(' ');
}

export function formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('es-PE', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}

export function getCategoryLabel(category: string): string {
    const map: Record<string, string> = {
        U18: 'Sub-18',
        U19: 'Sub-19',
        U21: 'Sub-21',
        adult: 'Adulto',
    };
    return map[category] ?? category;
}

export function getGenderLabel(gender: string): string {
    return gender === 'male' ? 'Masculino' : 'Femenino';
}

export function getDayLabel(day: string): string {
    const map: Record<string, string> = {
        monday: 'Lunes',
        tuesday: 'Martes',
        wednesday: 'Miércoles',
        thursday: 'Jueves',
        friday: 'Viernes',
        saturday: 'Sábado',
        sunday: 'Domingo',
    };
    return map[day] ?? day;
}
