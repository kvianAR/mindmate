import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { isText, optionalTopic, stringList, parsePagination } from '@/lib/validation.mjs'
import { getUserIdFromRequest } from '@/lib/auth'

export async function GET(request) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const pagination = parsePagination(searchParams, ['createdAt', 'updatedAt', 'front', 'topic', 'difficulty', 'lastReviewed', 'reviewCount'])
    if (!pagination) return NextResponse.json({ error: 'Invalid pagination or sort options' }, { status: 400 })
    const { page, limit, sortBy, sortOrder } = pagination
    const topic = searchParams.get('topic') || ''

    const skip = (page - 1) * limit

    const where = {
      userId,
      ...(topic && { topic })
    }

    const [flashcards, total] = await Promise.all([
      prisma.flashcard.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder }
      }),
      prisma.flashcard.count({ where })
    ])

    return NextResponse.json({
      flashcards,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch flashcards' },
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

    const { front, back, topic } = await request.json().catch(() => ({}))

    if (!isText(front) || !isText(back) || !optionalTopic(topic)) {
      return NextResponse.json(
        { error: 'Front and back are required' },
        { status: 400 }
      )
    }

    const flashcard = await prisma.flashcard.create({
      data: {
        front,
        back,
        topic: topic || null,
        userId
      }
    })

    return NextResponse.json(flashcard)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create flashcard' },
      { status: 500 }
    )
  }
}

export async function DELETE(request) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Flashcard ID is required' },
        { status: 400 }
      )
    }

    const flashcard = await prisma.flashcard.findFirst({
      where: {
        id,
        userId
      }
    })

    if (!flashcard) {
      return NextResponse.json(
        { error: 'Flashcard not found' },
        { status: 404 }
      )
    }

    await prisma.flashcard.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Flashcard deleted successfully' })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete flashcard' },
      { status: 500 }
    )
  }
}

