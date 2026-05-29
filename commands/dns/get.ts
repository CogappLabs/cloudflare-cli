import { defineCommand, option } from '@bunli/core'
import { z } from 'zod/v4'
import { getClient } from '../../src/auth.ts'
import { output } from '../../src/output.ts'

export default defineCommand({
  name: 'get',
  description: 'Get a single DNS record',
  options: {
    zone: option(z.string(), {
      description: 'Zone ID',
      short: 'z',
    }),
    id: option(z.string(), {
      description: 'DNS record ID',
    }),
    json: option(z.coerce.boolean().default(false), {
      description: 'Output as JSON',
      short: 'j',
      argumentKind: 'flag',
    }),
  },
  handler: async ({ flags }) => {
    const client = getClient()
    const record = await client.dns.records.get(flags.id, {
      zone_id: flags.zone,
    })
    output(record, flags.json)
  },
})
