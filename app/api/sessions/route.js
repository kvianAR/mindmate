import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { optionalTopic, stringList } from '@/lib/validation.mjs'
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

    const { topic, duration, notesStudied, flashcardsReviewed } = await request.json().catch(() => ({}))

    if (!Number.isInteger(duration) || duration < 1 || duration > 1440 || !optionalTopic(topic) || !stringList(notesStudied) || (flashcardsReviewed !== undefined && (!Number.isInteger(flashcardsReviewed) || flashcardsReviewed < 0 || flashcardsReviewed > 10000))) {
      return NextResponse.json(
        { error: 'Provide valid session fields and a duration of 1–1440 minutes' },
        { status: 400 }
      )
    }

    const session = await prisma.studySession.create({
      data: {
        topic: topic || null,
        duration,
        notesStudied: notesStudied || [],
        flashcardsReviewed: flashcardsReviewed ?? 0,
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

