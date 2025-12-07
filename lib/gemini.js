import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export async function generateSummary(topic, content) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
    const prompt = `Generate a concise and comprehensive study summary for the following topic: "${topic}". Include key concepts, important points, and main ideas. Make it well-structured and easy to understand.\n\nContent: ${content}`
    
    const result = await model.generateContent(prompt)
    const response = await result.response
    return response.text()
  } catch (error) {
    throw new Error('Failed to generate summary: ' + error.message)
  }
}

export async function generateFlashcards(topic, content) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
    const prompt = `Generate 5-10 flashcards for the topic: "${topic}". For each flashcard, provide a question on the front and a detailed answer on the back. Format the response as a JSON array where each object has "front" and "back" properties. Content: ${content}`
    
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    
    const cards = []
    const lines = text.split('\n').filter(line => line.trim())
    let currentCard = { front: '', back: '' }
    
    for (const line of lines) {
      if (line.match(/^(Q|Question|Front)[:\-]?\s*/i)) {
        if (currentCard.front) cards.push(currentCard)
        currentCard = { front: line.replace(/^(Q|Question|Front)[:\-]?\s*/i, '').trim(), back: '' }
      } else if (line.match(/^(A|Answer|Back)[:\-]?\s*/i)) {
        currentCard.back = line.replace(/^(A|Answer|Back)[:\-]?\s*/i, '').trim()
      } else if (currentCard.front && !currentCard.back) {
        currentCard.front += ' ' + line.trim()
      } else if (currentCard.front) {
        currentCard.back += ' ' + line.trim()
      }
    }
    if (currentCard.front) cards.push(currentCard)
    
    return cards.length > 0 ? cards : [{ front: 'Question', back: 'Answer' }]
  } catch (error) {
    throw new Error('Failed to generate flashcards: ' + error.message)
  }
}

export async function generateFlashcardsFromTopic(topic, count = 5, difficulty = 'medium') {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
    
    let difficultyPrompt = ''
    switch (difficulty) {
      case 'easy':
        difficultyPrompt = 'Focus on basic concepts and fundamental definitions. Keep questions simple and straightforward.'
        break
      case 'hard':
        difficultyPrompt = 'Include advanced concepts, critical thinking questions, and complex scenarios. Make questions challenging.'
        break
      default:
        difficultyPrompt = 'Include a mix of basic and intermediate concepts. Make questions clear but not too simple.'
    }
    
    const prompt = `Generate exactly ${count} study flashcards for the topic: "${topic}". ${difficultyPrompt}

Create engaging and educational flashcards that help students learn effectively. For each flashcard:
- Front: Clear, concise question or prompt
- Back: Detailed, accurate answer with explanations

Format your response as a valid JSON array where each object has exactly "front" and "back" properties.

Example format:
[
  {"front": "What is...?", "back": "The answer is... because..."},
  {"front": "How does...?", "back": "It works by... which means..."}
]

Make sure the questions are diverse, covering different aspects of ${topic}.`
    
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    // Try to extract JSON from the response
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      try {
        const flashcards = JSON.parse(jsonMatch[0])
        return flashcards.slice(0, count) // Ensure we return exactly the requested count
      } catch (parseError) {
        console.error('JSON parse error:', parseError)
      }
    }
    
    // Fallback parsing if JSON extraction fails
    const cards = []
    const lines = text.split('\n').filter(line => line.trim())
    let currentCard = { front: '', back: '' }
    
    for (const line of lines) {
      if (line.match(/^(Q|Question|Front)[:\-]?\s*/i)) {
        if (currentCard.front && currentCard.back) cards.push(currentCard)
        currentCard = { front: line.replace(/^(Q|Question|Front)[:\-]?\s*/i, '').trim(), back: '' }
      } else if (line.match(/^(A|Answer|Back)[:\-]?\s*/i)) {
        currentCard.back = line.replace(/^(A|Answer|Back)[:\-]?\s*/i, '').trim()
      } else if (currentCard.front && !currentCard.back) {
        currentCard.front += ' ' + line.trim()
      } else if (currentCard.front && currentCard.back) {
        currentCard.back += ' ' + line.trim()
      }
    }
    if (currentCard.front && currentCard.back) cards.push(currentCard)
    
    // Return the requested number of cards or fallback cards
    if (cards.length >= count) {
      return cards.slice(0, count)
    } else if (cards.length > 0) {
      return cards
    } else {
      // Fallback cards if parsing completely fails
      return Array.from({ length: Math.min(count, 3) }, (_, i) => ({
        front: `Study question ${i + 1} about ${topic}`,
        back: `This is a study answer about ${topic}. Review your materials for more detailed information.`
      }))
    }
  } catch (error) {
    console.error('Error generating flashcards from topic:', error)
    throw new Error('Failed to generate flashcards from topic: ' + error.message)
  }
}

export async function generateRecommendations(userNotes, userSessions) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
    
    const topics = [...new Set(userNotes.map(n => n.topic).filter(Boolean))]
    const recentTopics = userSessions.slice(0, 10).map(s => s.topic).filter(Boolean)
    
    const prompt = `Based on the following study history, suggest 3-5 topics or areas the student should focus on next. Be specific and actionable.\n\nTopics studied: ${topics.join(', ')}\nRecent sessions: ${recentTopics.join(', ')}\n\nProvide recommendations as a simple list, one per line.`
    
    const result = await model.generateContent(prompt)
    const response = await result.response
    return response.text().split('\n').filter(line => line.trim()).slice(0, 5)
  } catch (error) {
    return []
  }
}