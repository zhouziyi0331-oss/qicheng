import OpenAI from 'openai'

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
  baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'
})

export const AI_CONFIG = {
  model: process.env.OPENAI_MODEL || 'gpt-4',
  temperature: 0.7,
  maxTokens: 3000
}
