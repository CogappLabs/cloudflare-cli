import { defineCommand, option } from '@bunli/core'
import { z } from 'zod/v4'
import { getClient } from '../../src/auth.ts'
import { output } from '../../src/output.ts'

export default defineCommand({
  name: 'get',
  description: 'Get zone details and settings',
  options: {
    zone: option(z.string(), {
      description: 'Zone ID',
      short: 'z',
    }),
    json: option(z.coerce.boolean().default(false), {
      description: 'Output as JSON',
      short: 'j',
      argumentKind: 'flag',
    }),
  },
  handler: async ({ flags }) => {
    const client = getClient()
    const zone = await client.zones.get({ zone_id: flags.zone })
    output(zone, flags.json)
  },
})
