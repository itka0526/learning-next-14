import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import email from "next-auth/providers/email";
import { sql } from "@vercel/postgres";
import bcrypt from "bcrypt";

export const { auth, signIn, signOut } = NextAuth({
    ...authConfig,
    providers: [
        Credentials({
            // FOR LOGIN
            async authorize(creds) {
                const parsedCreds = z.object({ email: z.string().email(), password: z.string().min(6) }).safeParse(creds);
                if (parsedCreds.success) {
                    const { email, password } = parsedCreds.data;
                    const user = await getUser(email);
                    if (!user) return null;
                    const passwordsMatch = await bcrypt.compare(password, user.password);
                    if (passwordsMatch) return user;
                }
                return null;
            },
        }),
    ],
});

async function getUser(email: string) {
    try {
        const user = await sql`SELECT * FROM users WHERE email=${email}`;
        return user.rows[0];
    } catch (error) {
        console.error(error);
        throw Error("Failed to fetch user.");
    }
}
