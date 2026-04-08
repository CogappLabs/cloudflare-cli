import { defineCommand, option } from '@bunli/core'
import { z } from 'zod/v4'
import { getClient } from '../../src/auth.ts'
import { output } from '../../src/output.ts'

export default defineCommand({
  name: 'ip',
  description:
    'IP intelligence — threat data, ASN, geolocation, infrastructure type',
  options: {
    ip: option(z.string(), {
      description: 'IP address to look up (IPv4 or IPv6)',
    }),
    json: option(z.coerce.boolean().default(false), {
      description: 'Output as JSON',
      short: 'j',
    }),
  },
  handler: async ({ flags }) => {
    const client = getClient()

    let accountId: string | undefined
    for await (const zone of client.zones.list()) {
      accountId = zone.account?.id
      break
    }
    if (!accountId) {
      throw new Error(
        'Could not determine account ID from zones. Ensure your token has Zone:Read permission.',
      )
    }

    const isV6 = flags.ip.includes(':')
    const result = await client.intel.ips.get({
      account_id: accountId,
      ...(isV6 ? { ipv6: flags.ip } : { ipv4: flags.ip }),
    })

    if (!result || result.length === 0) {
      output([{ ip: flags.ip, result: 'No data found' }], flags.json)
      return
    }

    const rows = result.map((entry) => ({
      ip: entry.ip ?? flags.ip,
      asn: entry.belongs_to_ref?.value ?? '',
      asnDescription: entry.belongs_to_ref?.description ?? '',
      country: entry.belongs_to_ref?.country ?? '',
      infraType: entry.belongs_to_ref?.type ?? '',
      riskTypes:
        (entry.risk_types ?? []).map((r) => r.name).join(', ') || 'none',
    }))

    output(rows, flags.json)
  },
})
