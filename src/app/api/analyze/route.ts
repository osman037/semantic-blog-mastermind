import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'
import { getStoredApiKey } from '@/lib/api-key'

interface AnalysisResult {
  seoBlogOutline: string[]
  semanticEntities: string[]
  contentGaps: string[]
  userIntentTypes: string[]
  suggestedInternalTopics: string[]
}

export async function POST(request: NextRequest) {
  try {
    const { topic } = await request.json()

    if (!topic) {
      return NextResponse.json(
        { error: 'Topic is required' },
        { status: 400 }
      )
    }

    // Get API key - use user-provided key or fall back to default
    const userApiKey = getStoredApiKey()
    const defaultApiKey = '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'
    const apiKey = userApiKey || defaultApiKey

    // Initialize ZAI SDK with the appropriate API key
    const zai = await ZAI.create({
      apiKey: apiKey
    })

    // Step 1: Perform web search to get top 10 results
    const searchResults = await zai.functions.invoke("web_search", {
      query: topic,
      num: 10
    })

    // Format search results for the prompt
    const formattedResults = searchResults.map((result: any, index: number) => 
      `${index + 1}. Title: ${result.name}
   URL: ${result.url}
   Description: ${result.snippet}
   Host: ${result.host_name}`
    ).join('\n\n')

    // Step 2: Create the comprehensive prompt for LLM analysis
    const analysisPrompt = `You are an expert SEO content strategist and semantic analysis specialist. Analyze the following blog topic and competitor search results to generate a comprehensive content strategy.

BLOG TOPIC: "${topic}"

TOP 10 GOOGLE SEARCH RESULTS:
${formattedResults}

Please analyze this information and provide a detailed response in the following JSON format:

{
  "seoBlogOutline": [
    "Comprehensive H1 title that includes primary keyword",
    "Introduction hook that addresses user pain points",
    "H2 section covering core concepts and definitions",
    "H2 section with practical implementation steps",
    "H2 section addressing common challenges and solutions",
    "H2 section with expert tips and best practices",
    "H2 section featuring case studies or examples",
    "H2 section covering tools and resources",
    "H2 section with future trends or predictions",
    "Conclusion with key takeaways and call to action"
  ],
  "semanticEntities": [
    "Primary keyword",
    "Related LSI keywords",
    "Industry terms",
    "Concept phrases",
    "Technical terminology"
  ],
  "contentGaps": [
    "Missing topic that competitors haven't covered",
    "Underdeveloped concept that needs expansion",
    "Unique angle not addressed by competitors",
    "Audience segment being ignored",
    "Practical application missing from existing content"
  ],
  "userIntentTypes": [
    "Informational intent",
    "Commercial intent",
    "Navigational intent",
    "Transactional intent"
  ],
  "suggestedInternalTopics": [
    "Related topic for internal linking",
    "Supporting content idea",
    "Follow-up article concept",
    "Complementary guide topic",
    "Advanced discussion topic"
  ]
}

Important guidelines:
1. The SEO outline should be comprehensive and follow best practices for on-page SEO
2. Semantic entities should include the main keyword and related terms that help with topical authority
3. Content gaps should identify opportunities to create better, more comprehensive content than competitors
4. User intent types should reflect the primary search intentions for this topic
5. Suggested internal topics should be relevant for building a content cluster around this main topic

Provide your response in valid JSON format only, without any additional text or explanation.`

    // Step 3: Call LLM for analysis
    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an expert SEO content strategist and semantic analysis specialist. You always respond in valid JSON format.'
        },
        {
          role: 'user',
          content: analysisPrompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    })

    // Extract the response content
    const responseContent = completion.choices[0]?.message?.content

    if (!responseContent) {
      throw new Error('No response from LLM')
    }

    // Parse the JSON response
    let analysisResult: AnalysisResult
    try {
      // Clean the response content to ensure it's valid JSON
      const cleanContent = responseContent.trim().replace(/^```json\n?/, '').replace(/\n?```$/, '')
      analysisResult = JSON.parse(cleanContent)
    } catch (parseError) {
      console.error('Failed to parse LLM response:', responseContent)
      throw new Error('Failed to parse analysis results')
    }

    // Validate the response structure
    const requiredFields = ['seoBlogOutline', 'semanticEntities', 'contentGaps', 'userIntentTypes', 'suggestedInternalTopics']
    for (const field of requiredFields) {
      if (!analysisResult[field as keyof AnalysisResult] || !Array.isArray(analysisResult[field as keyof AnalysisResult])) {
        throw new Error(`Invalid or missing field: ${field}`)
      }
    }

    return NextResponse.json(analysisResult)

  } catch (error) {
    console.error('Analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze topic. Please try again.' },
      { status: 500 }
    )
  }
}