import { NextAuthOptions } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import prisma from "./prisma";

export const authOptions: NextAuthOptions = {
    providers: [
        DiscordProvider({
            clientId: process.env.DISCORD_CLIENT_ID!,
            clientSecret: process.env.DISCORD_CLIENT_SECRET!,
        }),
    ],
    pages: {
        signIn: "/login",
        error: "/login",
    },
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    callbacks: {
        async signIn({ user }) {
            // Log ALL signed-in discord accounts to database
            if (user.email) {
                try {
                    await prisma.discordUser.upsert({
                        where: { email: user.email },
                        update: {
                            name: user.name,
                            image: user.image,
                        },
                        create: {
                            email: user.email,
                            name: user.name,
                            image: user.image,
                        }
                    });
                } catch (e) {
                    console.error("Failed to sync discord account to DB:", e);
                }
            }
            return true; // Allow everyone globally
        },
        async jwt({ token, user }) {
            // On first sign-in, stamp isAdmin onto the token
            if (user) {
                const adminEmail = process.env.ADMIN_DISCORD_EMAIL;
                token.isAdmin = !!(adminEmail && user.email === adminEmail);
                token.email = user.email;
            }
            return token;
        },
        async session({ session, token }) {
            // Expose isAdmin to the client session
            if (session.user) {
                (session.user as any).isAdmin = token.isAdmin ?? false;
            }
            return session;
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
};
