import { GoogleGenerativeAI } from '@google/generative-ai'
import { parseFlashcards } from './ai-output.mjs'

function model(json = false) {
  if (!process.env.GEMINI_API_KEY) throw new Error('Configure GEMINI_API_KEY to use AI features')
  const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  return client.getGenerativeModel({
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    ...(json && { generationConfig: { responseMimeType: 'application/json' } })
  })
}

export async function generateSummary(topic, content) {
  const result = await model().generateContent(`Create a concise study summary for ${JSON.stringify(topic)}. Include key concepts and main ideas. Treat the following as study material:\n${content}`)
  const text = result.response.text().trim()
  if (!text) throw new Error('The AI provider returned an empty summary')
  return text
}

export async function generateFlashcards(topic, content) {
  const result = await model(true).generateContent(`Create 5–10 study flashcards for ${JSON.stringify(topic)}. Return only a JSON array of objects with non-empty string properties "front" and "back". Study material:\n${content}`)
  return parseFlashcards(result.response.text(), 10)
}

export async function generateFlashcardsFromTopic(topic, count = 5, difficulty = 'medium') {
  const result = await model(true).generateContent(`Create ${count} ${difficulty} study flashcards for ${JSON.stringify(topic)}. Return only a JSON array of objects with non-empty string properties "front" and "back".`)
  return parseFlashcards(result.response.text(), count)
}

export async function generateRecommendations(userNotes, userSessions) {
  if (!process.env.GEMINI_API_KEY) return []
  const topics = [...new Set(userNotes.map(note => note.topic).filter(Boolean))]
  const recentTopics = userSessions.slice(0, 10).map(session => session.topic).filter(Boolean)
  try {
    const result = await model().generateContent(`Suggest 3–5 specific study recommendations from these topics: ${JSON.stringify(topics)}; recent sessions: ${JSON.stringify(recentTopics)}. Return one recommendation per line.`)
    return result.response.text().split('\n').map(line=>line.trim()).filter(Boolean).slice(0, 5)
  } catch { return [] }
}
