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
        }
    },
    secret: process.env.NEXTAUTH_SECRET,
};
