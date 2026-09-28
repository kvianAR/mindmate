import { NextResponse } from 'next/server'
import { isText } from '@/lib/validation.mjs'
import { getUserIdFromRequest } from '@/lib/auth'
import { generateSummary } from '@/lib/gemini'

export async function POST(request) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { topic, content } = await request.json().catch(() => ({}))

    if (!isText(topic, 200) || !isText(content, 100000)) {
      return NextResponse.json(
        { error: 'Topic and content are required' },
        { status: 400 }
      )
    }

    const summary = await generateSummary(topic, content)

    return NextResponse.json({ summary })
  } catch (error) {
    return NextResponse.json(
      { error: 'Unable to generate a summary. Check the AI provider configuration and quota.' },
      { status: 500 }
    )
  }
}

