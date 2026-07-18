import { NextAuthOptions } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";

export const authOptions: NextAuthOptions = {
    providers: [
        DiscordProvider({
            clientId: process.env.DISCORD_CLIENT_ID!,
            clientSecret: process.env.DISCORD_CLIENT_SECRET!,
        }),
    ],
    pages: {
        signIn: "/login",
        error: "/login", // Redirect unauthorized users back to login
    },
    callbacks: {
        async signIn({ user }) {
            const adminEmail = process.env.ADMIN_DISCORD_EMAIL;

            // If the user's Discord email perfectly matches your ADMIN_DISCORD_EMAIL, allow login!
            if (adminEmail && user.email?.toLowerCase() === adminEmail.toLowerCase()) {
                return true;
            }

            // Otherwise, reject the login (you can't sit with us)
            return false;
        }
    },
    secret: process.env.NEXTAUTH_SECRET,
};
