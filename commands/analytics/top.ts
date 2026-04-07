import { defineCommand, option } from '@bunli/core'
import { z } from 'zod/v4'
import { graphqlQuery } from '../../src/graphql.ts'
import { output } from '../../src/output.ts'

const DIMENSION_MAP: Record<string, { node: string; field: string }> = {
  ip: { node: 'httpRequestsAdaptiveGroups', field: 'clientIP' },
  country: { node: 'httpRequestsAdaptiveGroups', field: 'clientCountryName' },
  ua: { node: 'httpRequestsAdaptiveGroups', field: 'userAgent' },
  path: { node: 'httpRequestsAdaptiveGroups', field: 'clientRequestPath' },
}

export default defineCommand({
  name: 'top',
  description: 'Top N items by dimension (ip, ua, country, path)',
  options: {
    zone: option(z.string(), {
      description: 'Zone ID',
      short: 'z',
    }),
    by: option(z.enum(['ip', 'ua', 'country', 'path']), {
      description: 'Dimension to group by',
    }),
    limit: option(z.coerce.number().default(10), {
      description: 'Number of results (default: 10)',
      short: 'n',
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
    const dim = DIMENSION_MAP[flags.by]
    const since = new Date()
    since.setDate(since.getDate() - flags.days)
    const sinceStr = since.toISOString().split('T')[0]
    const untilStr = new Date().toISOString().split('T')[0]

    const query = `query ($zoneTag: string!, $since: string!, $until: string!, $limit: Int!) {
      viewer {
        zones(filter: { zoneTag: $zoneTag }) {
          ${dim.node}(
            limit: $limit
            filter: { date_geq: $since, date_leq: $until }
            orderBy: [count_DESC]
          ) {
            count
            dimensions { ${dim.field} }
          }
        }
      }
    }`

    const data = await graphqlQuery<{
      viewer: {
        zones: Array<
          Record<
            string,
            Array<{
              count: number
              dimensions: Record<string, string>
            }>
          >
        >
      }
    }>(query, {
      zoneTag: flags.zone,
      since: sinceStr,
      until: untilStr,
      limit: flags.limit,
    })

    const groups = data.viewer.zones[0]?.[dim.node] ?? []
    const rows = groups.map(
      (g: { count: number; dimensions: Record<string, string> }) => ({
        [flags.by]: g.dimensions[dim.field],
        count: g.count,
      }),
    )

    output(rows, flags.json)
  },
})
