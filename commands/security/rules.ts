import { defineCommand, option } from '@bunli/core'
import { z } from 'zod/v4'
import { getClient } from '../../src/auth.ts'
import { output } from '../../src/output.ts'

export default defineCommand({
  name: 'rules',
  description: 'List WAF/firewall rulesets, or show rules within a ruleset',
  options: {
    zone: option(z.string(), {
      description: 'Zone ID',
      short: 'z',
    }),
    id: option(z.string().optional(), {
      description: 'Ruleset ID to show individual rules',
    }),
    json: option(z.coerce.boolean().default(false), {
      description: 'Output as JSON',
      short: 'j',
    }),
  },
  handler: async ({ flags }) => {
    const client = getClient()

    if (flags.id) {
      const ruleset = await client.rulesets.get(flags.id, {
        zone_id: flags.zone,
      })
      const rules = (ruleset.rules ?? []).map((r) => ({
        id: r.id ?? '',
        description: r.description ?? '',
        action: r.action ?? '',
        expression: r.expression ?? '',
        enabled: r.enabled ?? false,
      }))
      output(rules, flags.json)
      return
    }

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
