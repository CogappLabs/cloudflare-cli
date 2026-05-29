import { defineCommand, option } from '@bunli/core'
import { z } from 'zod/v4'
import { graphqlQuery } from '../../src/graphql.ts'
import { output } from '../../src/output.ts'
import { resolveWindow } from '../../src/time.ts'

interface SecurityEventsData {
  viewer: {
    zones: Array<{
      firewallEventsAdaptive: Array<{
        action: string
        source: string
        clientIP: string
        clientRequestHTTPHost: string
        clientRequestPath: string
        clientRequestHTTPMethodName: string
        datetime: string
        userAgent: string
        ruleId: string
      }>
    }>
  }
}

export default defineCommand({
  name: 'events',
  description: 'Security and firewall events',
  options: {
    zone: option(z.string(), {
      description: 'Zone ID',
      short: 'z',
    }),
    action: option(z.string().optional(), {
      description:
        'Filter by action (block, challenge, jschallenge, managedChallenge, log)',
    }),
    source: option(z.string().optional(), {
      description:
        'Filter by source (waf, firewallRules, rateLimit, botManagement, etc.)',
    }),
    ip: option(z.string().optional(), {
      description: 'Filter by client IP',
    }),
    limit: option(z.coerce.number().default(25), {
      description: 'Number of results (default: 25, max: 10000)',
      short: 'n',
    }),
    hours: option(z.coerce.number().default(24), {
      description: 'Hours to look back (default: 24). Ignored if --since set.',
    }),
    since: option(z.string().optional(), {
      description:
        'Window start: ISO ("2026-05-21T15:50Z"), date, relative ("2h", "30m"), or "now"',
    }),
    until: option(z.string().optional(), {
      description: 'Window end (default: now). Same formats as --since.',
    }),
    json: option(z.coerce.boolean().default(false), {
      description: 'Output as JSON',
      short: 'j',
      argumentKind: 'flag',
    }),
  },
  handler: async ({ flags }) => {
    const { since, until } = resolveWindow({
      since: flags.since,
      until: flags.until,
      hours: flags.since ? undefined : flags.hours,
    })

    const filters: string[] = ['datetime_geq: $since', 'datetime_leq: $until']
    const vars: Record<string, unknown> = {
      zoneTag: flags.zone,
      since,
      until,
      limit: flags.limit,
    }

    if (flags.action) {
      filters.push('action: $action')
      vars.action = flags.action
    }
    if (flags.source) {
      filters.push('source: $source')
      vars.source = flags.source
    }
    if (flags.ip) {
      filters.push('clientIP: $ip')
      vars.ip = flags.ip
    }
    const varDefs = [
      '$zoneTag: string!',
      '$since: string!',
      '$until: string!',
      '$limit: Int!',
      flags.action ? '$action: string!' : '',
      flags.source ? '$source: string!' : '',
      flags.ip ? '$ip: string!' : '',
    ]
      .filter(Boolean)
      .join(', ')

    const data = await graphqlQuery<SecurityEventsData>(
      `query (${varDefs}) {
        viewer {
          zones(filter: { zoneTag: $zoneTag }) {
            firewallEventsAdaptive(
              limit: $limit
              filter: { ${filters.join(', ')} }
              orderBy: [datetime_DESC]
            ) {
              action
              source
              clientIP
              clientRequestHTTPHost
              clientRequestPath
              clientRequestHTTPMethodName
              datetime
              userAgent
              ruleId
            }
          }
        }
      }`,
      vars,
    )

    const events = (data.viewer.zones[0]?.firewallEventsAdaptive ?? []).map(
      (e) => ({
        datetime: e.datetime,
        action: e.action,
        source: e.source,
        ip: e.clientIP,
        method: e.clientRequestHTTPMethodName,
        path: e.clientRequestPath,
        userAgent: e.userAgent,
        ruleId: e.ruleId,
      }),
    )

    output(events, flags.json)
  },
})
