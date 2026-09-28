import { NextResponse } from 'next/server'
import { isText } from '@/lib/validation.mjs'
import prisma from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth'
import { generateFlashcards, generateFlashcardsFromTopic } from '@/lib/gemini'

export async function POST(request) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { topic, content, count = 5, difficulty = 'medium', saveToDatabase = true } = await request.json().catch(() => ({}))

    if (!isText(topic, 200) || (content !== undefined && content !== '' && !isText(content, 100000)) || !Number.isInteger(count) || count < 1 || count > 20 || !['easy','medium','hard'].includes(difficulty) || typeof saveToDatabase !== 'boolean') {
      return NextResponse.json(
        { error: 'Topic is required' },
        { status: 400 }
      )
    }

    let flashcards

    if (content) {
      flashcards = await generateFlashcards(topic, content)
    } else {
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
      { error: 'Unable to generate flashcards. Check the AI provider configuration and quota.' },
      { status: 500 }
    )
  }
}

