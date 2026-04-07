import { defineCommand, option } from '@bunli/core'
import { z } from 'zod/v4'
import { getClient } from '../../src/auth.ts'
import { output } from '../../src/output.ts'

export default defineCommand({
  name: 'list',
  description: 'List all zones',
  options: {
    json: option(z.coerce.boolean().default(false), {
      description: 'Output as JSON',
      short: 'j',
    }),
  },
  handler: async ({ flags }) => {
    const client = getClient()
    const zones: Array<{
      id: string
      name: string
      status: string
      plan: string
    }> = []
    for await (const zone of client.zones.list()) {
      zones.push({
        id: zone.id,
        name: zone.name,
        status: zone.status ?? '',
        plan: zone.plan?.name ?? '',
      })
    }
    output(zones, flags.json)
  },
})
