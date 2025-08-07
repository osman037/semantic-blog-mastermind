// In-memory storage for API key (shared across API routes)
let openRouterApiKey: string | null = null

export function getStoredApiKey(): string | null {
  return openRouterApiKey
}

export function setStoredApiKey(apiKey: string): void {
  openRouterApiKey = apiKey
}

export function clearStoredApiKey(): void {
  openRouterApiKey = null
}