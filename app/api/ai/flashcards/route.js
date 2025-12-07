import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth'
import { generateFlashcards, generateFlashcardsFromTopic } from '@/lib/gemini'

export async function POST(request) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { topic, content, count = 5, difficulty = 'medium', saveToDatabase = true } = await request.json()

    if (!topic) {
      return NextResponse.json(
        { error: 'Topic is required' },
        { status: 400 }
      )
    }

    let flashcards

    // If content is provided, generate flashcards from content
    if (content) {
      flashcards = await generateFlashcards(topic, content)
    } else {
      // Generate flashcards based on topic alone for study sessions
      flashcards = await generateFlashcardsFromTopic(topic, count, difficulty)
    }

    if (saveToDatabase) {
      const createdCards = await Promise.all(
        flashcards.map(card =>
          prisma.flashcard.create({
            data: {
              front: card.front,
              back: card.back,
              topic,
              userId,
              difficulty: difficulty
            }
          })
        )
      )
      return NextResponse.json({ flashcards: createdCards })
    }

    return NextResponse.json({ flashcards })
  } catch (error) {
    console.error('Flashcard generation error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate flashcards' },
      { status: 500 }
    )
  }
}

