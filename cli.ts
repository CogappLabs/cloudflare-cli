#!/usr/bin/env bun
import { createCLI } from '@bunli/core'
import authGroup from './commands/auth.ts'

const cli = await createCLI({
  name: 'cf',
  version: '0.1.0',
  description: 'Read-only CLI for Cloudflare analytics, logs, and security',
})

cli.command(authGroup)

await cli.run()
