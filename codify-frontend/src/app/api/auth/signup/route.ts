import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma, withPrismaRetry } from '@/lib/prisma'
import { validatePassword } from '@/utils/passwordValidation'

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, role } = await request.json()

    // Validate input
    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate name
    if (name.trim().length < 2) {
      return NextResponse.json(
        { error: 'Name must be at least 2 characters long' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      )
    }

    // Validate password strength
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { 
          error: 'Password does not meet security requirements',
          details: passwordValidation.errors
        },
        { status: 400 }
      )
    }

    // Validate role
    if (!['STUDENT', 'TEACHER'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role specified' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await withPrismaRetry(async () => {
      return await prisma.user.findUnique({
        where: { email: email.toLowerCase() }
      });
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email address already exists. Please use a different email or try signing in.' },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user (avoid transaction issues with local MongoDB)
    let user;
    try {
      user = await withPrismaRetry(async () => {
        return await prisma.user.create({
          data: {
            name: name.trim(),
            email: email.toLowerCase(),
            password: hashedPassword,
            role,
          },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
          }
        });
      });
    } catch (error: unknown) {
      console.error('User creation error:', error)
      if (error && typeof error === 'object' && 'code' in error) {
        if (error.code === 'P2002') {
          return NextResponse.json(
            { error: 'An account with this email address already exists. Please use a different email or try signing in.' },
            { status: 409 }
          )
        }
        if (error.code === 'P2031') {
          return NextResponse.json(
            { error: 'Database configuration issue. Please contact support if this problem persists.' },
            { status: 500 }
          )
        }
      }
      throw error
    }

    return NextResponse.json(
      { 
        user,
        message: 'Account created successfully! You can now sign in with your credentials.'
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred while creating your account. Please try again later.' },
      { status: 500 }
    )
  }
}
