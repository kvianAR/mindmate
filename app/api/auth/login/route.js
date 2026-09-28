import { NextResponse } from 'next/server'
import { validateCredentials } from '@/lib/validation.mjs'
import prisma from '@/lib/prisma'
import { comparePassword, generateToken } from '@/lib/auth'

export async function POST(request) {
  try {
    const credentials = validateCredentials(await request.json().catch(() => null))

    if (!credentials) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const { email, password } = credentials

    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user || !(await comparePassword(password, user.password))) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    const token = generateToken(user.id)

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt
      },
      token
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to login' },
      { status: 500 }
    )
  }
}

