import { defineCommand, option } from '@bunli/core'
import { z } from 'zod/v4'
import { graphqlQuery } from '../../src/graphql.ts'
import { output } from '../../src/output.ts'

interface TrafficData {
  viewer: {
    zones: Array<{
      httpRequests1dGroups: Array<{
        dimensions: { date: string }
        sum: {
          requests: number
          bytes: number
          threats: number
          pageViews: number
        }
      }>
    }>
  }
}

export default defineCommand({
  name: 'traffic',
  description: 'HTTP request analytics for a zone',
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
      argumentKind: 'flag',
    }),
  },
  handler: async ({ flags }) => {
    const since = new Date()
    since.setDate(since.getDate() - flags.days)
    const sinceStr = since.toISOString().split('T')[0]

    const data = await graphqlQuery<TrafficData>(
      `query ($zoneTag: string!, $since: string!) {
        viewer {
          zones(filter: { zoneTag: $zoneTag }) {
            httpRequests1dGroups(limit: 100, filter: { date_geq: $since }, orderBy: [date_ASC]) {
              dimensions { date }
              sum { requests bytes threats pageViews }
            }
          }
        }
      }`,
      { zoneTag: flags.zone, since: sinceStr },
    )

    const rows = (data.viewer.zones[0]?.httpRequests1dGroups ?? []).map(
      (g) => ({
        date: g.dimensions.date,
        requests: g.sum.requests,
        bytes: g.sum.bytes,
        threats: g.sum.threats,
        pageViews: g.sum.pageViews,
      }),
    )

    output(rows, flags.json)
  },
})
