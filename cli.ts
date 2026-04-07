#!/usr/bin/env bun
import { createCLI } from '@bunli/core'

const cli = await createCLI({
  name: 'cf',
  version: '0.1.0',
  description: 'Read-only CLI for Cloudflare analytics, logs, and security',
})

await cli.run()
