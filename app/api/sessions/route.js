import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth'

export async function GET(request) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sessions = await prisma.studySession.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20
    })

    return NextResponse.json(sessions)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { topic, duration, notesStudied, flashcardsReviewed } = await request.json()

    if (duration === undefined || duration === null) {
      return NextResponse.json(
        { error: 'Duration is required' },
        { status: 400 }
      )
    }

    const session = await prisma.studySession.create({
      data: {
        topic: topic || null,
        duration: parseInt(duration),
        notesStudied: notesStudied || [],
        flashcardsReviewed: parseInt(flashcardsReviewed) || 0,
        userId
      }
    })

    return NextResponse.json(session)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    )
  }
}

