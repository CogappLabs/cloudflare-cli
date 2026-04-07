import { defineCommand, option } from '@bunli/core'
import { z } from 'zod/v4'
import { getClient } from '../../src/auth.ts'
import { output } from '../../src/output.ts'

export default defineCommand({
  name: 'rules',
  description: 'List WAF/firewall rulesets',
  options: {
    zone: option(z.string(), {
      description: 'Zone ID',
      short: 'z',
    }),
    json: option(z.coerce.boolean().default(false), {
      description: 'Output as JSON',
      short: 'j',
    }),
  },
  handler: async ({ flags }) => {
    const client = getClient()
    const rulesets: Array<{
      id: string
      name: string
      kind: string
      phase: string
    }> = []
    for await (const ruleset of client.rulesets.list({ zone_id: flags.zone })) {
      rulesets.push({
        id: ruleset.id,
        name: ruleset.name ?? '',
        kind: ruleset.kind,
        phase: ruleset.phase,
      })
    }
    output(rulesets, flags.json)
  },
})
