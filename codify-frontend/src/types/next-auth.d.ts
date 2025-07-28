import 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      role: 'STUDENT' | 'TEACHER' | 'ADMIN'
      onboardingCompleted?: boolean
    }
  }

  interface User {
    id: string
    email: string
    name?: string | null
    role: 'STUDENT' | 'TEACHER' | 'ADMIN'
    onboardingCompleted?: boolean
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: 'STUDENT' | 'TEACHER' | 'ADMIN'
    onboardingCompleted?: boolean
  }
}
