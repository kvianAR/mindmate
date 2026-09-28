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
    const pagination = parsePagination(searchParams, ['createdAt', 'updatedAt', 'title', 'topic'])
    if (!pagination) return NextResponse.json({ error: 'Invalid pagination or sort options' }, { status: 400 })
    const { page, limit, sortBy, sortOrder } = pagination
    const search = searchParams.get('search') || ''
    const topic = searchParams.get('topic') || ''

    const skip = (page - 1) * limit

    const where = {
      userId,
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { content: { contains: search, mode: 'insensitive' } }
        ]
      }),
      ...(topic && { topic })
    }

    const [notes, total] = await Promise.all([
      prisma.note.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          title: true,
          content: true,
          topic: true,
          tags: true,
          createdAt: true,
          updatedAt: true
        }
      }),
      prisma.note.count({ where })
    ])

    return NextResponse.json({
      notes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch notes' },
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

    const { title, content, topic, tags } = await request.json().catch(() => ({}))

    if (!isText(title, 300) || !isText(content, 100000) || !optionalTopic(topic) || !stringList(tags)) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      )
    }

    const note = await prisma.note.create({
      data: {
        title,
        content,
        topic: topic || null,
        tags: tags || [],
        userId
      }
    })

    
    return NextResponse.json(note)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create note' },
      { status: 500 }
    )
  }
}
