import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth'
import { generateFlashcards } from '@/lib/gemini'

export async function POST(request) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { topic, content, saveToDatabase } = await request.json()

    if (!topic || !content) {
      return NextResponse.json(
        { error: 'Topic and content are required' },
        { status: 400 }
      )
    }

    const flashcards = await generateFlashcards(topic, content)

    if (saveToDatabase) {
      const createdCards = await Promise.all(
        flashcards.map(card =>
          prisma.flashcard.create({
            data: {
              front: card.front,
              back: card.back,
              topic,
              userId
            }
          })
        )
      )
      return NextResponse.json({ flashcards: createdCards })
    }

    return NextResponse.json({ flashcards })
  } catch (error) {
    return NextResponse.json(
      { error: error.message || 'Failed to generate flashcards' },
      { status: 500 }
    )
  }
}

