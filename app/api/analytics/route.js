import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth'
import { generateRecommendations } from '@/lib/gemini'

export async function GET(request) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const days = Number(searchParams.get('days') || '30')
    if (!Number.isInteger(days) || days < 1 || days > 365) {
      return NextResponse.json({ error: 'days must be between 1 and 365' }, { status: 400 })
    }

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const [notes, flashcards, sessions, totalNotes, totalFlashcards, totalSessions] = await Promise.all([
      prisma.note.findMany({
        where: {
          userId,
          createdAt: { gte: startDate }
        },
        select: {
          id: true,
          topic: true,
          createdAt: true
        }
      }),
      prisma.flashcard.findMany({
        where: {
          userId,
          createdAt: { gte: startDate }
        },
        select: {
          id: true,
          topic: true,
          reviewCount: true,
          createdAt: true
        }
      }),
      prisma.studySession.findMany({
        where: {
          userId,
          createdAt: { gte: startDate }
        },
        orderBy: { createdAt: 'desc' },
        take: 100
      }),
      prisma.note.count({ where: { userId } }),
      prisma.flashcard.count({ where: { userId } }),
      prisma.studySession.count({ where: { userId } })
    ])

    const topics = [...new Set(notes.map(n => n.topic).filter(Boolean))]
    const totalStudyTime = sessions.reduce((sum, s) => sum + s.duration, 0)
    const totalFlashcardReviews = flashcards.reduce((sum, f) => sum + f.reviewCount, 0)

    const dailyActivity = {}
    sessions.forEach(session => {
      const date = session.createdAt.toISOString().split('T')[0]
      if (!dailyActivity[date]) {
        dailyActivity[date] = { sessions: 0, duration: 0 }
      }
      dailyActivity[date].sessions += 1
      dailyActivity[date].duration += session.duration
    })

    const recommendations = await generateRecommendations(notes, sessions)

    return NextResponse.json({
      overview: {
        totalNotes,
        totalFlashcards,
        totalSessions,
        totalStudyTime,
        totalFlashcardReviews,
        topicsStudied: topics.length
      },
      recentActivity: {
        notesCreated: notes.length,
        flashcardsCreated: flashcards.length,
        sessionsCompleted: sessions.length
      },
      dailyActivity: Object.entries(dailyActivity).map(([date, data]) => ({
        date,
        ...data
      })),
      recommendations: recommendations.filter(Boolean).slice(0, 5),
      topTopics: topics.slice(0, 5)
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}

