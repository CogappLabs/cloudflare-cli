import { defineCommand, option } from '@bunli/core'
import { z } from 'zod/v4'
import { graphqlQuery } from '../../src/graphql.ts'
import { output } from '../../src/output.ts'

interface BotData {
  viewer: {
    zones: Array<{
      httpRequests1dGroups: Array<{
        dimensions: { botManagementDecision: string }
        sum: { requests: number }
      }>
    }>
  }
}

export default defineCommand({
  name: 'bots',
  description: 'Bot score distribution for a zone',
  options: {
    zone: option(z.string(), {
      description: 'Zone ID',
      short: 'z',
    }),
    days: option(z.coerce.number().default(7), {
      description: 'Number of days to look back (default: 7)',
      short: 'd',
    }),
    json: option(z.coerce.boolean().default(false), {
      description: 'Output as JSON',
      short: 'j',
    }),
  },
  handler: async ({ flags }) => {
    const since = new Date()
    since.setDate(since.getDate() - flags.days)
    const sinceStr = since.toISOString().split('T')[0]

    const data = await graphqlQuery<BotData>(
      `query ($zoneTag: string!, $since: string!) {
        viewer {
          zones(filter: { zoneTag: $zoneTag }) {
            httpRequests1dGroups(limit: 100, filter: { date_geq: $since }) {
              dimensions { botManagementDecision }
              sum { requests }
            }
          }
        }
      }`,
      { zoneTag: flags.zone, since: sinceStr },
    )

    const rows = (data.viewer.zones[0]?.httpRequests1dGroups ?? []).map(
      (g) => ({
        classification: g.dimensions.botManagementDecision,
        requests: g.sum.requests,
      }),
    )

    output(rows, flags.json)
  },
})
