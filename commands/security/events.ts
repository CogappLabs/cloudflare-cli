import { defineCommand, option } from '@bunli/core'
import { z } from 'zod/v4'
import { graphqlQuery } from '../../src/graphql.ts'
import { output } from '../../src/output.ts'

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
      description: 'Number of results (default: 25)',
      short: 'n',
    }),
    hours: option(z.coerce.number().default(24), {
      description: 'Hours to look back (default: 24)',
    }),
    json: option(z.coerce.boolean().default(false), {
      description: 'Output as JSON',
      short: 'j',
    }),
  },
  handler: async ({ flags }) => {
    const since = new Date(
      Date.now() - flags.hours * 60 * 60 * 1000,
    ).toISOString()

    const filters: string[] = ['datetime_geq: $since']
    const vars: Record<string, unknown> = {
      zoneTag: flags.zone,
      since,
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
