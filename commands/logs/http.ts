import { readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { defineCommand, option } from '@bunli/core'
import { z } from 'zod/v4'
import { output } from '../../src/output.ts'

const TOKEN_PATH = join(homedir(), '.config', 'cf-cli', 'token.json')

const DEFAULT_FIELDS = [
  'ClientIP',
  'ClientRequestHost',
  'ClientRequestMethod',
  'ClientRequestURI',
  'EdgeResponseStatus',
  'EdgeStartTimestamp',
  'ClientRequestUserAgent',
  'BotScore',
  'BotScoreSrc',
].join(',')

export default defineCommand({
  name: 'http',
  description: 'HTTP request logs (Enterprise plan required)',
  options: {
    zone: option(z.string(), {
      description: 'Zone ID',
      short: 'z',
    }),
    minutes: option(z.coerce.number().default(5), {
      description: 'Minutes to look back (default: 5, max: 60)',
      short: 'm',
    }),
    limit: option(z.coerce.number().default(100), {
      description: 'Number of results (default: 100)',
      short: 'n',
    }),
    ip: option(z.string().optional(), {
      description: 'Filter by client IP (post-fetch)',
    }),
    ua: option(z.string().optional(), {
      description: 'Filter by user agent substring (post-fetch)',
    }),
    status: option(z.coerce.number().optional(), {
      description: 'Filter by HTTP status code (post-fetch)',
    }),
    path: option(z.string().optional(), {
      description: 'Filter by request path substring (post-fetch)',
    }),
    method: option(z.string().optional(), {
      description: 'Filter by HTTP method (post-fetch)',
    }),
    'bot-score': option(z.coerce.number().optional(), {
      description:
        'Filter by max bot score (post-fetch, lower = more bot-like)',
    }),
    json: option(z.coerce.boolean().default(false), {
      description: 'Output as JSON',
      short: 'j',
    }),
  },
  handler: async ({ flags }) => {
    const content = readFileSync(TOKEN_PATH, 'utf-8')
    const { apiToken } = JSON.parse(content)
    if (!apiToken)
      throw new Error('No API token configured. Run `cf auth login`.')

    const end = new Date()
    const start = new Date(end.getTime() - flags.minutes * 60 * 1000)

    const url = new URL(
      `https://api.cloudflare.com/client/v4/zones/${flags.zone}/logs/received`,
    )
    url.searchParams.set('start', start.toISOString())
    url.searchParams.set('end', end.toISOString())
    url.searchParams.set('fields', DEFAULT_FIELDS)
    url.searchParams.set('sample', '1')
    url.searchParams.set('count', String(flags.limit))

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${apiToken}` },
    })

    if (!res.ok) {
      if (res.status === 403) {
        throw new Error('Logpull API requires an Enterprise plan.')
      }
      throw new Error(`Logpull request failed: ${res.status} ${res.statusText}`)
    }

    const text = await res.text()
    let logs = text
      .trim()
      .split('\n')
      .filter(Boolean)
      .map((line) => JSON.parse(line))

    // Post-fetch filters
    if (flags.ip) {
      logs = logs.filter(
        (l: Record<string, unknown>) => l.ClientIP === flags.ip,
      )
    }
    if (flags.ua) {
      const ua = flags.ua.toLowerCase()
      logs = logs.filter((l: Record<string, unknown>) =>
        (l.ClientRequestUserAgent as string)?.toLowerCase().includes(ua),
      )
    }
    if (flags.status) {
      logs = logs.filter(
        (l: Record<string, unknown>) => l.EdgeResponseStatus === flags.status,
      )
    }
    if (flags.path) {
      logs = logs.filter((l: Record<string, unknown>) =>
        (l.ClientRequestURI as string)?.includes(flags.path ?? ''),
      )
    }
    if (flags.method) {
      const m = flags.method.toUpperCase()
      logs = logs.filter(
        (l: Record<string, unknown>) => l.ClientRequestMethod === m,
      )
    }
    if (flags['bot-score'] !== undefined) {
      logs = logs.filter(
        (l: Record<string, unknown>) =>
          (l.BotScore as number) !== undefined &&
          (l.BotScore as number) <= (flags['bot-score'] ?? 0),
      )
    }

    const rows = logs.map((l: Record<string, unknown>) => ({
      time: l.EdgeStartTimestamp,
      status: l.EdgeResponseStatus,
      method: l.ClientRequestMethod,
      path: l.ClientRequestURI,
      ip: l.ClientIP,
      ua: l.ClientRequestUserAgent,
      botScore: l.BotScore,
    }))

    output(rows, flags.json)
  },
})
