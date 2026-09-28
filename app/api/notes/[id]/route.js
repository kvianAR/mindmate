import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { isText, optionalTopic, stringList } from '@/lib/validation.mjs'
import { getUserIdFromRequest } from '@/lib/auth'

export async function GET(request, { params }) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const note = await prisma.note.findFirst({
      where: {
        id,
        userId
      }
    })

    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 })
    }

    return NextResponse.json(note)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch note' },
      { status: 500 }
    )
  }
}

export async function PUT(request, { params }) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { title, content, topic, tags } = await request.json().catch(() => ({}))
    if ((title !== undefined && !isText(title, 300)) || (content !== undefined && !isText(content, 100000)) || !optionalTopic(topic) || !stringList(tags)) {
      return NextResponse.json({ error: 'Invalid note fields' }, { status: 400 })
    }

    const note = await prisma.note.findFirst({
      where: {
        id,
        userId
      }
    })

    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 })
    }

    const updatedNote = await prisma.note.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(content && { content }),
        ...(topic !== undefined && { topic: topic || null }),
        ...(tags && { tags })
      }
    })

    return NextResponse.json(updatedNote)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update note' },
      { status: 500 }
    )
  }
}

export async function DELETE(request, { params }) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const note = await prisma.note.findFirst({
      where: {
        id,
        userId
      }
    })

    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 })
    }

    await prisma.note.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Note deleted successfully' })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete note' },
      { status: 500 }
    )
  }
}