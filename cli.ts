#!/usr/bin/env bun
import { createCLI } from '@bunli/core'
import analyticsGroup from './commands/analytics.ts'
import authGroup from './commands/auth.ts'
import dnsGroup from './commands/dns.ts'
import intelGroup from './commands/intel.ts'
import logsGroup from './commands/logs.ts'
import securityGroup from './commands/security.ts'
import zonesGroup from './commands/zones.ts'

const cli = await createCLI({
  name: 'cf',
  version: '0.1.0',
  description: 'Read-only CLI for Cloudflare analytics, logs, and security',
})

cli.command(authGroup)
cli.command(analyticsGroup)
cli.command(dnsGroup)
cli.command(intelGroup)
cli.command(logsGroup)
cli.command(securityGroup)
cli.command(zonesGroup)

await cli.run()
