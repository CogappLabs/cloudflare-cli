import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import Cloudflare from 'cloudflare'

const CONFIG_DIR = join(homedir(), '.config', 'cf-cli')
const TOKEN_PATH = join(CONFIG_DIR, 'token.json')

function ensureConfigDir() {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true })
  }
}

function loadToken(): string | null {
  if (existsSync(TOKEN_PATH)) {
    const content = readFileSync(TOKEN_PATH, 'utf-8')
    const data = JSON.parse(content)
    if (data.apiToken) return data.apiToken
  }
  return process.env.CF_API_KEY ?? null
}

export function saveToken(apiToken: string) {
  ensureConfigDir()
  writeFileSync(TOKEN_PATH, JSON.stringify({ apiToken }, null, 2))
}

export function getClient(): Cloudflare {
  return new Cloudflare({ apiToken: getToken() })
}

export async function verifyToken(): Promise<{
  valid: boolean
  status?: string
}> {
  const client = getClient()
  const result = await client.user.tokens.verify()
  return { valid: result.status === 'active', status: result.status }
}

export function getToken(): string {
  const token = loadToken()
  if (!token) {
    throw new Error(
      'No API token configured.\n' +
        'Run `cfa auth login`, set CF_API_KEY in .env, or export CF_API_KEY.',
    )
  }
  return token
}

export function hasToken(): boolean {
  return loadToken() !== null
}

export { CONFIG_DIR, TOKEN_PATH }
