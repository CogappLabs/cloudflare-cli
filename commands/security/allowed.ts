import { defineCommand, option } from '@bunli/core'
import { z } from 'zod/v4'
import { graphqlQuery } from '../../src/graphql.ts'
import { output } from '../../src/output.ts'

interface HttpRequestsData {
  viewer: {
    zones: Array<{
      httpRequestsAdaptiveGroups: Array<{
        count: number
        dimensions: {
          clientIP: string
          clientRequestHTTPMethodName: string
          clientRequestPath: string
          userAgent: string
          edgeResponseStatus: number
        }
      }>
    }>
  }
}

export default defineCommand({
  name: 'allowed',
  description:
    'Allowed-through traffic grouped by IP and user agent (high volume first)',
  options: {
    zone: option(z.string(), {
      description: 'Zone ID',
      short: 'z',
    }),
    limit: option(z.coerce.number().default(25), {
      description: 'Number of results (default: 25)',
      short: 'n',
    }),
    hours: option(z.coerce.number().default(23), {
      description: 'Hours to look back (default: 23, max: 23)',
    }),
    ip: option(z.string().optional(), {
      description: 'Filter by client IP',
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

    const filters: string[] = [
      'datetime_geq: $since',
      'edgeResponseStatus_lt: 403',
    ]
    const vars: Record<string, unknown> = {
      zoneTag: flags.zone,
      since,
      limit: flags.limit,
    }
    const varDefs = ['$zoneTag: string!', '$since: string!', '$limit: Int!']

    if (flags.ip) {
      filters.push('clientIP: $ip')
      vars.ip = flags.ip
      varDefs.push('$ip: string!')
    }

    const data = await graphqlQuery<HttpRequestsData>(
      `query (${varDefs.join(', ')}) {
        viewer {
          zones(filter: { zoneTag: $zoneTag }) {
            httpRequestsAdaptiveGroups(
              limit: $limit
              filter: { ${filters.join(', ')} }
              orderBy: [count_DESC]
            ) {
              count
              dimensions {
                clientIP
                clientRequestHTTPMethodName
                clientRequestPath
                userAgent
                edgeResponseStatus
              }
            }
          }
        }
      }`,
      vars,
    )

    const events = (data.viewer.zones[0]?.httpRequestsAdaptiveGroups ?? []).map(
      (g) => ({
        requests: g.count,
        ip: g.dimensions.clientIP,
        method: g.dimensions.clientRequestHTTPMethodName,
        status: g.dimensions.edgeResponseStatus,
        path: g.dimensions.clientRequestPath,
        userAgent: g.dimensions.userAgent,
      }),
    )

    output(events, flags.json)
  },
})
