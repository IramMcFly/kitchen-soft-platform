import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export const authOptions = {
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error('Credenciales inválidas');
                }

                await dbConnect();

                const emailRegex = new RegExp(`^${credentials.email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
                const user = await User.findOne({ email: { $regex: emailRegex } }).select('+password');

                if (!user) {
                    throw new Error('Usuario no encontrado');
                }

                const isMatch = await bcrypt.compare(credentials.password, user.password);

                if (!isMatch) {
                    throw new Error('Contraseña incorrecta');
                }

                return {
                    id: user._id.toString(),
                    name: user.name,
                    email: user.email,
                    plan: user.plan,
                    restaurantName: user.restaurantName,
                    role: user.role
                };
            },
        }),
    ],
    session: {
        strategy: 'jwt' as const,
    },
    callbacks: {
        async jwt({ token, user, trigger, session }: any) {
            if (user) {
                token.id = user.id;
                token.plan = user.plan;
                token.restaurantName = user.restaurantName;
                token.role = user.role;
            }

            if (trigger === "update" && token) {
                await dbConnect();
                // Assuming token.id is available from initial sign in
                const freshUser = await User.findById(token.id);
                if (freshUser) {
                    token.plan = freshUser.plan;
                    token.restaurantName = freshUser.restaurantName;
                    token.role = freshUser.role;
                    token.name = freshUser.name;
                }
            }

            return token;
        },
        async session({ session, token }: any) {
            if (session.user) {
                session.user.id = token.id;
                session.user.plan = token.plan;
                session.user.restaurantName = token.restaurantName;
                session.user.role = token.role;
            }
            return session;
        },
    },
    pages: {
        signIn: '/auth/login',
    },
    secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
