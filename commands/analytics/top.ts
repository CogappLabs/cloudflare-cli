import { defineCommand, option } from '@bunli/core'
import { z } from 'zod/v4'
import { graphqlQuery } from '../../src/graphql.ts'
import { output } from '../../src/output.ts'
import { resolveWindow } from '../../src/time.ts'

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
    days: option(z.coerce.number().optional(), {
      description:
        'Days to look back. Ignored if --hours/--since set. Mutually exclusive with --hours.',
      short: 'd',
    }),
    hours: option(z.coerce.number().optional(), {
      description:
        'Hours to look back. Ignored if --since set. Mutually exclusive with --days.',
    }),
    minutes: option(z.coerce.number().optional(), {
      description: 'Minutes to look back. Ignored if --since set.',
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
    const dim = DIMENSION_MAP[flags.by]

    if (flags.days !== undefined && flags.hours !== undefined) {
      throw new Error('Use only one of --days or --hours.')
    }

    const hours =
      flags.since !== undefined
        ? undefined
        : flags.hours !== undefined
          ? flags.hours
          : flags.minutes !== undefined
            ? undefined
            : flags.days !== undefined
              ? flags.days * 24
              : 7 * 24 // default 7 days, matches prior behaviour

    const { since, until } = resolveWindow({
      since: flags.since,
      until: flags.until,
      hours,
      minutes: flags.minutes,
    })

    const query = `query ($zoneTag: string!, $since: Time!, $until: Time!, $limit: Int!) {
      viewer {
        zones(filter: { zoneTag: $zoneTag }) {
          ${dim.node}(
            limit: $limit
            filter: { datetime_geq: $since, datetime_leq: $until }
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
      since,
      until,
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
