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
  if (!existsSync(TOKEN_PATH)) return null
  const content = readFileSync(TOKEN_PATH, 'utf-8')
  const data = JSON.parse(content)
  return data.apiToken ?? null
}

export function saveToken(apiToken: string) {
  ensureConfigDir()
  writeFileSync(TOKEN_PATH, JSON.stringify({ apiToken }, null, 2))
}

export function getClient(): Cloudflare {
  const token = loadToken()
  if (!token) {
    throw new Error(
      'No API token configured.\n' +
        'Run `cf auth login` to save your Cloudflare API token.',
    )
  }
  return new Cloudflare({ apiToken: token })
}

export async function verifyToken(): Promise<{
  valid: boolean
  status?: string
}> {
  const client = getClient()
  const result = await client.user.tokens.verify()
  return { valid: result.status === 'active', status: result.status }
}

export function hasToken(): boolean {
  return loadToken() !== null
}

export { CONFIG_DIR, TOKEN_PATH }
