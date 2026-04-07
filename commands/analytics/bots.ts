import { defineCommand, option } from '@bunli/core'
import { z } from 'zod/v4'
import { graphqlQuery } from '../../src/graphql.ts'
import { output } from '../../src/output.ts'

interface ThreatData {
  viewer: {
    zones: Array<{
      firewallEventsAdaptive: Array<{
        action: string
        source: string
      }>
    }>
  }
}

export default defineCommand({
  name: 'bots',
  description: 'Threat/bot summary — actions and sources',
  options: {
    zone: option(z.string(), {
      description: 'Zone ID',
      short: 'z',
    }),
    hours: option(z.coerce.number().default(23), {
      description: 'Hours to look back (default: 23, max: 23)',
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

    const data = await graphqlQuery<ThreatData>(
      `query ($zoneTag: string!, $since: string!) {
        viewer {
          zones(filter: { zoneTag: $zoneTag }) {
            firewallEventsAdaptive(
              limit: 10000
              filter: { datetime_geq: $since }
              orderBy: [datetime_DESC]
            ) {
              action
              source
            }
          }
        }
      }`,
      { zoneTag: flags.zone, since },
    )

    const events = data.viewer.zones[0]?.firewallEventsAdaptive ?? []
    const totals: Record<string, number> = {}
    for (const e of events) {
      const key = `${e.action} (${e.source})`
      totals[key] = (totals[key] ?? 0) + 1
    }

    const rows = Object.entries(totals)
      .map(([actionSource, count]) => ({ actionSource, count }))
      .sort((a, b) => b.count - a.count)

    output(rows, flags.json)
  },
})
