// src/lib/auth.ts
import GoogleProvider from "next-auth/providers/google"; // Remove if you're not using Google
import CredentialsProvider from "next-auth/providers/credentials"; // Add if you're using manual login
import { AuthOptions } from "next-auth";

export const authOptions: AuthOptions = {
  providers: [
    // If using credentials login
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Replace this with your user lookup logic (e.g., MongoDB + bcrypt)
        const res = await fetch(`${process.env.NEXTAUTH_URL}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(credentials),
        });

        const user = await res.json();
        if (res.ok && user) return user;
        return null;
      },
    }),

    // Optional: Google login
    // GoogleProvider({
    //   clientId: process.env.GOOGLE_CLIENT_ID!,
    //   clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    // }),
  ],
  callbacks: {
    async session({ session, token }) {
      // attach user ID
      if (token?.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login", // optional
  },
  secret: process.env.NEXTAUTH_SECRET,
};
