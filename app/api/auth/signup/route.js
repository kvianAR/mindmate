import { NextResponse } from 'next/server'
import { validateCredentials } from '@/lib/validation.mjs'
import prisma from '@/lib/prisma'
import { hashPassword, generateToken } from '@/lib/auth'

export async function POST(request) {
  try {
    const credentials = validateCredentials(await request.json().catch(() => null), true)

    if (!credentials) {
      return NextResponse.json(
        { error: 'Provide a valid email, name and password (8–72 bytes)' },
        { status: 400 }
      )
    }

    const { email, name, password } = credentials

    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      )
    }

    const hashedPassword = await hashPassword(password)

    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true
      }
    })

    const token = generateToken(user.id)

    return NextResponse.json({
      user,
      token
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
}

