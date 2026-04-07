import { defineCommand, option } from '@bunli/core'
import type Cloudflare from 'cloudflare'
import { z } from 'zod/v4'
import { getClient } from '../../src/auth.ts'
import { output } from '../../src/output.ts'

export default defineCommand({
  name: 'list',
  description: 'List DNS records for a zone',
  options: {
    zone: option(z.string(), {
      description: 'Zone ID',
      short: 'z',
    }),
    type: option(z.string().optional(), {
      description: 'Filter by record type (A, AAAA, CNAME, MX, TXT, etc.)',
      short: 't',
    }),
    json: option(z.coerce.boolean().default(false), {
      description: 'Output as JSON',
      short: 'j',
    }),
  },
  handler: async ({ flags }) => {
    const client = getClient()
    const records: Array<{
      id: string
      type: string
      name: string
      content: string
      ttl: number
      proxied: boolean
    }> = []
    const params: {
      zone_id: string
      type?: Cloudflare.DNS.RecordListParams['type']
    } = { zone_id: flags.zone }
    if (flags.type) {
      params.type = flags.type as Cloudflare.DNS.RecordListParams['type']
    }
    for await (const record of client.dns.records.list(params)) {
      records.push({
        id: record.id ?? '',
        type: record.type,
        name: record.name,
        content: record.content ?? '',
        ttl: record.ttl,
        proxied: record.proxied ?? false,
      })
    }
    output(records, flags.json)
  },
})
