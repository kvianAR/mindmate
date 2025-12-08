import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth'
import { generateRecommendations } from '@/lib/gemini'

function calculateCurrentStreak(sessions) {
  if (!sessions.length) return 0
  
  const uniqueDays = [...new Set(sessions.map(s => 
    new Date(s.createdAt).toDateString()
  ))].sort((a, b) => new Date(b) - new Date(a))
  
  let streak = 0
  const today = new Date().toDateString()
  const yesterday = new Date(Date.now() - 86400000).toDateString()
  
  if (uniqueDays.includes(today) || uniqueDays.includes(yesterday)) {
    let currentDate = uniqueDays.includes(today) ? new Date() : new Date(Date.now() - 86400000)
    
    for (const dayString of uniqueDays) {
      const day = new Date(dayString)
      if (day.toDateString() === currentDate.toDateString()) {
        streak++
        currentDate = new Date(currentDate.getTime() - 86400000)
      } else if (day < currentDate) {
        break
      }
    }
  }
  
  return streak
}

function calculateLongestStreak(sessions) {
  if (!sessions.length) return 0
  
  const uniqueDays = [...new Set(sessions.map(s => 
    new Date(s.createdAt).toDateString()
  ))].sort((a, b) => new Date(a) - new Date(b))
  
  let longestStreak = 0
  let currentStreak = 1
  
  for (let i = 1; i < uniqueDays.length; i++) {
    const prevDay = new Date(uniqueDays[i - 1])
    const currentDay = new Date(uniqueDays[i])
    const dayDifference = (currentDay - prevDay) / (1000 * 60 * 60 * 24)
    
    if (dayDifference === 1) {
      currentStreak++
    } else {
      longestStreak = Math.max(longestStreak, currentStreak)
      currentStreak = 1
    }
  }
  
  return Math.max(longestStreak, currentStreak)
}

export async function GET(request) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')

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
    
    const avgSessionDuration = sessions.length > 0 ? Math.round(totalStudyTime / sessions.length) : 0
    const flashcardsPerSession = sessions.length > 0 ? 
      Math.round(sessions.reduce((sum, s) => sum + (s.flashcardsReviewed || 0), 0) / sessions.length) : 0
    
    const sessionsByTopic = {}
    sessions.forEach(session => {
      if (session.topic) {
        if (!sessionsByTopic[session.topic]) {
          sessionsByTopic[session.topic] = { count: 0, totalTime: 0 }
        }
        sessionsByTopic[session.topic].count += 1
        sessionsByTopic[session.topic].totalTime += session.duration
      }
    })
    
    const topTopicsByTime = Object.entries(sessionsByTopic)
      .map(([topic, data]) => ({
        topic,
        sessions: data.count,
        totalTime: data.totalTime,
        avgTime: Math.round(data.totalTime / data.count)
      }))
      .sort((a, b) => b.totalTime - a.totalTime)
      .slice(0, 5)

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
        topicsStudied: topics.length,
        avgSessionDuration,
        flashcardsPerSession
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
      topTopics: topics.slice(0, 5),
      topTopicsByTime: topTopicsByTime,
      studyStreaks: {
        current: calculateCurrentStreak(sessions),
        longest: calculateLongestStreak(sessions)
      }
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}

