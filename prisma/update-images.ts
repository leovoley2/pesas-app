import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Map exercise names to their image file names
const imageMap: Record<string, string> = {
    'Sentadilla con Barra': '/exercises/squat.jpg',
    'Peso Muerto Convencional': '/exercises/deadlift.jpg',
    'Peso Muerto Rumano': '/exercises/rdl.jpg',
    'Sentadilla Búlgara': '/exercises/bulgarian_squat.jpg',
    'Hip Thrust con Barra': '/exercises/hip_thrust.jpg',
    'Press Militar': '/exercises/overhead_press.jpg',
    'Colgada de Potencia (Hang Clean)': '/exercises/hang_clean.jpg',
    'Cargada de Potencia (Power Clean)': '/exercises/hang_clean.jpg', // reuse
    'Salto Vertical con Contramovement (CMJ)': '/exercises/cmj.jpg',
};

async function main() {
    console.log('🖼️  Updating exercise image URLs...');

    for (const [name, imageUrl] of Object.entries(imageMap)) {
        const result = await prisma.exercise.updateMany({
            where: { name },
            data: { imageUrl },
        });
        if (result.count > 0) {
            console.log(`  ✅ ${name} → ${imageUrl}`);
        } else {
            console.log(`  ⚠️  Not found: ${name}`);
        }
    }

    console.log('\n✅ Image URLs updated!');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
