import { NextRequest, NextResponse } from 'next/server'
import { getStoredApiKey, setStoredApiKey, clearStoredApiKey } from '@/lib/api-key'

export async function POST(request: NextRequest) {
  try {
    const { apiKey } = await request.json()

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 400 }
      )
    }

    // Validate API key format (OpenRouter keys typically start with 'sk-or-')
    if (!apiKey.startsWith('sk-or-')) {
      return NextResponse.json(
        { error: 'Invalid OpenRouter API key format. Keys should start with "sk-or-"' },
        { status: 400 }
      )
    }

    // Basic validation - check if it's a reasonable length
    if (apiKey.length < 20) {
      return NextResponse.json(
        { error: 'API key is too short' },
        { status: 400 }
      )
    }

    // Store the API key
    setStoredApiKey(apiKey)

    return NextResponse.json({ 
      success: true, 
      message: 'API key saved successfully',
      hasKey: true 
    })

  } catch (error) {
    console.error('API key save error:', error)
    return NextResponse.json(
      { error: 'Failed to save API key' },
      { status: 500 }
    )
  }
}

export async function GET() {
  const apiKey = getStoredApiKey()
  return NextResponse.json({ 
    hasKey: !!apiKey,
    // Return masked version for security
    keyPreview: apiKey ? `${apiKey.slice(0, 8)}...${apiKey.slice(-4)}` : null
  })
}

export async function DELETE() {
  clearStoredApiKey()
  return NextResponse.json({ 
    success: true, 
    message: 'API key removed successfully',
    hasKey: false 
  })
}