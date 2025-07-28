import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import type { Adapter } from 'next-auth/adapters'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
        })

        if (!user || !user.password) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          onboardingCompleted: user.onboardingCompleted,
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      // If this is the initial sign in, use the user data
      if (user) {
        return {
          ...token,
          role: user.role,
          onboardingCompleted: user.onboardingCompleted || false,
        }
      }
      
      // If token is being updated (e.g., after onboarding), refresh user data
      if (trigger === 'update') {
        try {
          const updatedUser = await prisma.user.findUnique({
            where: { id: token.sub },
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
              onboardingCompleted: true,
            }
          });
          
          if (updatedUser) {
            return {
              ...token,
              role: updatedUser.role,
              onboardingCompleted: updatedUser.onboardingCompleted || false,
            }
          }
        } catch (error) {
          console.error('Error refreshing user data in JWT callback:', error);
        }
      }
      
      // Ensure onboardingCompleted is always a boolean
      if (token.onboardingCompleted === undefined || token.onboardingCompleted === null) {
        token.onboardingCompleted = false;
      }
      
      return token
    },
    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.sub!,
          role: token.role,
          onboardingCompleted: token.onboardingCompleted || false,
        },
      }
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
}
