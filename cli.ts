#!/usr/bin/env bun
import { createCLI } from '@bunli/core'
import analyticsGroup from './commands/analytics.ts'
import authGroup from './commands/auth.ts'
import dnsGroup from './commands/dns.ts'
import zonesGroup from './commands/zones.ts'

const cli = await createCLI({
  name: 'cf',
  version: '0.1.0',
  description: 'Read-only CLI for Cloudflare analytics, logs, and security',
})

cli.command(authGroup)
cli.command(zonesGroup)
cli.command(dnsGroup)
cli.command(analyticsGroup)

await cli.run()
