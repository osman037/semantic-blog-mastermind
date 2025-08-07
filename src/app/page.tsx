"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Search, Sparkles, Target, Zap, Lightbulb, Link, Key, CheckCircle, XCircle, Settings } from "lucide-react"

interface AnalysisResult {
  seoBlogOutline: string[]
  semanticEntities: string[]
  contentGaps: string[]
  userIntentTypes: string[]
  suggestedInternalTopics: string[]
}

interface ApiKeyStatus {
  hasKey: boolean
  keyPreview: string | null
}

export default function Home() {
  const [topic, setTopic] = useState("")
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<AnalysisResult | null>(null)
  const [apiKeyStatus, setApiKeyStatus] = useState<ApiKeyStatus>({ hasKey: false, keyPreview: null })
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false)
  const [newApiKey, setNewApiKey] = useState("")
  const [validatingKey, setValidatingKey] = useState(false)
  const [savingKey, setSavingKey] = useState(false)
  const [keyValidationMessage, setKeyValidationMessage] = useState<string | null>(null)
  const [keyValidationSuccess, setKeyValidationSuccess] = useState(false)

  // Fetch API key status on component mount
  useEffect(() => {
    fetchApiKeyStatus()
  }, [])

  const fetchApiKeyStatus = async () => {
    try {
      const response = await fetch("/api/config/api-key")
      const data = await response.json()
      setApiKeyStatus(data)
    } catch (error) {
      console.error("Failed to fetch API key status:", error)
    }
  }

  const validateApiKey = async (key: string) => {
    setValidatingKey(true)
    setKeyValidationMessage(null)
    
    try {
      const response = await fetch("/api/config/validate-api-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: key })
      })

      const data = await response.json()
      
      if (response.ok) {
        setKeyValidationMessage(data.message)
        setKeyValidationSuccess(true)
      } else {
        setKeyValidationMessage(data.error || "Validation failed")
        setKeyValidationSuccess(false)
      }
    } catch (error) {
      setKeyValidationMessage("Failed to validate API key")
      setKeyValidationSuccess(false)
    } finally {
      setValidatingKey(false)
    }
  }

  const saveApiKey = async () => {
    if (!newApiKey.trim()) return

    setSavingKey(true)
    
    try {
      const response = await fetch("/api/config/api-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: newApiKey })
      })

      if (response.ok) {
        await fetchApiKeyStatus()
        setNewApiKey("")
        setKeyValidationMessage(null)
        setKeyValidationSuccess(false)
        setShowApiKeyDialog(false)
      } else {
        const data = await response.json()
        setKeyValidationMessage(data.error || "Failed to save API key")
        setKeyValidationSuccess(false)
      }
    } catch (error) {
      setKeyValidationMessage("Failed to save API key")
      setKeyValidationSuccess(false)
    } finally {
      setSavingKey(false)
    }
  }

  const removeApiKey = async () => {
    try {
      await fetch("/api/config/api-key", { method: "DELETE" })
      await fetchApiKeyStatus()
      setNewApiKey("")
      setKeyValidationMessage(null)
      setKeyValidationSuccess(false)
    } catch (error) {
      console.error("Failed to remove API key:", error)
    }
  }

  const handleGenerate = async () => {
    if (!topic.trim()) return

    setLoading(true)
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ topic }),
      })

      if (!response.ok) {
        throw new Error("Failed to analyze topic")
      }

      const data = await response.json()
      setResults(data)
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4 py-8">
          <div className="flex items-center justify-between">
            <div className="flex-1" />
            <div className="flex flex-col items-center space-y-4">
              <h1 className="text-4xl font-bold tracking-tight lg:text-5xl">
                Semantic Blog Mastermind
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                AI-powered blog analysis that scrapes top Google results and generates perfect SEO + Semantic + LLMEO optimized outlines
              </p>
            </div>
            <div className="flex-1 flex justify-end">
              <Dialog open={showApiKeyDialog} onOpenChange={setShowApiKeyDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Settings className="h-4 w-4" />
                    API Key
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Key className="h-5 w-5" />
                      OpenRouter API Key Configuration
                    </DialogTitle>
                    <DialogDescription>
                      Configure your OpenRouter API key to use your own account. 
                      If no key is provided, a default key will be used.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    {/* Current Status */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Current Status</label>
                      <div className="flex items-center gap-2">
                        {apiKeyStatus.hasKey ? (
                          <>
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-sm text-green-600">
                              API key configured: {apiKeyStatus.keyPreview}
                            </span>
                            <Button variant="outline" size="sm" onClick={removeApiKey}>
                              Remove
                            </Button>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-4 w-4 text-red-500" />
                            <span className="text-sm text-red-600">
                              Using default API key
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* New API Key Input */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">New API Key</label>
                      <Input
                        type="password"
                        placeholder="sk-or-v1-..."
                        value={newApiKey}
                        onChange={(e) => setNewApiKey(e.target.value)}
                        className="font-mono text-sm"
                      />
                    </div>

                    {/* Validation Message */}
                    {keyValidationMessage && (
                      <Alert className={keyValidationSuccess ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                        <AlertDescription className={keyValidationSuccess ? "text-green-700" : "text-red-700"}>
                          {keyValidationMessage}
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button
                        onClick={() => validateApiKey(newApiKey)}
                        disabled={!newApiKey.trim() || validatingKey}
                        variant="outline"
                        size="sm"
                      >
                        {validatingKey ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : null}
                        Validate
                      </Button>
                      <Button
                        onClick={saveApiKey}
                        disabled={!newApiKey.trim() || !keyValidationSuccess || savingKey}
                        size="sm"
                      >
                        {savingKey ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : null}
                        Save Key
                      </Button>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      Get your API key from{" "}
                      <a 
                        href="https://openrouter.ai/keys" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="underline"
                      >
                        OpenRouter
                      </a>
                    </p>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* Input Section */}
        <Card className="mx-auto max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Enter Blog Topic
            </CardTitle>
            <CardDescription>
              Provide a topic and let AI analyze competitors to generate the perfect blog outline
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="e.g., Best practices for remote work productivity"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleGenerate()}
                className="flex-1"
              />
              <Button 
                onClick={handleGenerate} 
                disabled={loading || !topic.trim()}
                className="px-6"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Outline
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results Section */}
        {results && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Analysis Results for: "{topic}"
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="outline" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="outline" className="flex items-center gap-1">
                    <Target className="h-4 w-4" />
                    <span className="hidden sm:inline">Outline</span>
                  </TabsTrigger>
                  <TabsTrigger value="entities" className="flex items-center gap-1">
                    <Zap className="h-4 w-4" />
                    <span className="hidden sm:inline">Entities</span>
                  </TabsTrigger>
                  <TabsTrigger value="gaps" className="flex items-center gap-1">
                    <Lightbulb className="h-4 w-4" />
                    <span className="hidden sm:inline">Gaps</span>
                  </TabsTrigger>
                  <TabsTrigger value="intent" className="flex items-center gap-1">
                    <Search className="h-4 w-4" />
                    <span className="hidden sm:inline">Intent</span>
                  </TabsTrigger>
                  <TabsTrigger value="topics" className="flex items-center gap-1">
                    <Link className="h-4 w-4" />
                    <span className="hidden sm:inline">Topics</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="outline" className="space-y-4">
                  <div className="grid gap-4">
                    <h3 className="text-lg font-semibold">SEO Blog Outline</h3>
                    <div className="space-y-2">
                      {results.seoBlogOutline.map((item, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 rounded-lg border">
                          <Badge variant="secondary" className="mt-0.5">
                            {index + 1}
                          </Badge>
                          <p className="text-sm leading-relaxed">{item}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="entities" className="space-y-4">
                  <div className="grid gap-4">
                    <h3 className="text-lg font-semibold">Semantic Entities</h3>
                    <div className="flex flex-wrap gap-2">
                      {results.semanticEntities.map((entity, index) => (
                        <Badge key={index} variant="outline" className="text-sm">
                          {entity}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="gaps" className="space-y-4">
                  <div className="grid gap-4">
                    <h3 className="text-lg font-semibold">Content Gaps</h3>
                    <div className="space-y-2">
                      {results.contentGaps.map((gap, index) => (
                        <div key={index} className="p-3 rounded-lg border bg-muted/50">
                          <p className="text-sm">{gap}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="intent" className="space-y-4">
                  <div className="grid gap-4">
                    <h3 className="text-lg font-semibold">User Intent Types</h3>
                    <div className="flex flex-wrap gap-2">
                      {results.userIntentTypes.map((intent, index) => (
                        <Badge key={index} className="text-sm">
                          {intent}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="topics" className="space-y-4">
                  <div className="grid gap-4">
                    <h3 className="text-lg font-semibold">Suggested Internal Topics</h3>
                    <div className="space-y-2">
                      {results.suggestedInternalTopics.map((topic, index) => (
                        <div key={index} className="p-3 rounded-lg border">
                          <p className="text-sm font-medium">{topic}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {loading && (
          <Card>
            <CardContent className="space-y-4 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm font-medium">Analyzing competitors and generating insights...</span>
              </div>
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/6" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Watermark */}
        <div className="text-center py-8 text-muted-foreground">
          Created 😎 by Usman
        </div>
      </div>
    </div>
  )
}