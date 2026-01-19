import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { loginSchema } from "@/schemas/auth.schema";
import { UserStatus, UserRole } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: UserRole;
      status: UserStatus;
      image?: string | null;
    };
  }

  interface User {
    role: UserRole;
    status: UserStatus;
  }
}

// Comentado pois next-auth/jwt não é usado no build
// declare module "next-auth/jwt" {
//   interface JWT {
//     role: UserRole;
//     status: UserStatus;
//   }
// }

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma) as any, // Type casting needed due to custom User fields (role, status)
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Validate input
        const validated = loginSchema.safeParse(credentials);
        if (!validated.success) {
          return null;
        }

        const { email, password } = validated.data;

        // Find user
        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
        });

        if (!user) {
          return null;
        }

        // Verify password
        const isValid = await verifyPassword(password, user.passwordHash);
        if (!isValid) {
          return null;
        }

        // Check if blocked
        if (user.status === UserStatus.BLOCKED) {
          throw new Error("Conta bloqueada. Entre em contato com o suporte.");
        }

        // Return user for JWT
        return {
          id: user.id,
          email: user.email,
          name: user.fullName,
          role: user.role,
          status: user.status,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // Para OAuth providers, criar UserProfile se não existir
      if (account?.provider !== "credentials" && user.id) {
        const existingProfile = await prisma.userProfile.findUnique({
          where: { userId: user.id },
        });

        if (!existingProfile) {
          await prisma.userProfile.create({
            data: {
              userId: user.id,
              // Campos vazios - usuário preencherá depois
            },
          });
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      // Add custom data to token
      if (user) {
        token.role = user.role;
        token.status = user.status;
      }
      return token;
    },
    async session({ session, token }) {
      // Add custom data to session
      if (session.user) {
        session.user.id = token.sub!;
        session.user.role = token.role as UserRole;
        session.user.status = token.status as UserStatus;
        
        // 🔍 LOG DO USUÁRIO LOGADO - Para debug
        console.log("\n👤 USUÁRIO LOGADO:");
        console.log("   ID:", session.user.id);
        console.log("   Email:", session.user.email);
        console.log("   Role:", session.user.role);
        console.log("");
      }
      return session;
    },
  },
});
