import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export const { handlers, auth, signIn, signOut } = NextAuth({
    trustHost: true,
    secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
    session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
    pages: { signIn: '/login' },
    debug: process.env.NODE_ENV === 'development',
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.role = (user as any).role;
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as any).role = token.role;
                (session.user as any).id = token.id;
            }
            return session;
        },
    },
    providers: [
        Credentials({
            name: 'credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                console.log('Authorize called with email:', credentials?.email);
                try {
                    if (!credentials?.email || !credentials?.password) {
                        console.log('Missing credentials');
                        return null;
                    }

                    const user = await prisma.user.findUnique({
                        where: { email: credentials.email as string },
                    });

                    if (!user) {
                        console.log('User not found in DB');
                        return null;
                    }

                    const isValid = await bcrypt.compare(
                        credentials.password as string,
                        user.password
                    );

                    if (!isValid) {
                        console.log('Invalid password');
                        return null;
                    }

                    console.log('Login successful for:', user.email);
                    return { id: user.id, email: user.email, name: user.name, role: user.role };
                } catch (error) {
                    console.error('Error in authorize function:', error);
                    return null;
                }
            },
        }),
    ],
});
