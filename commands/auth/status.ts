import { defineCommand } from '@bunli/core'
import {
  CONFIG_DIR,
  hasToken,
  TOKEN_PATH,
  verifyToken,
} from '../../src/auth.ts'

export default defineCommand({
  name: 'status',
  description: 'Show current authentication status',
  handler: async ({ colors }) => {
    console.log(`Config directory: ${CONFIG_DIR}\n`)

    if (!hasToken()) {
      console.log(colors.yellow('Not authenticated.'))
      console.log('Run `cfa auth login` to save your Cloudflare API token.')
      return
    }

    console.log(`Token file: ${TOKEN_PATH}`)

    try {
      const { valid, status } = await verifyToken()
      if (valid) {
        console.log(`Status: ${colors.green(status ?? 'active')}`)
      } else {
        console.log(`Status: ${colors.yellow(status ?? 'unknown')}`)
      }
    } catch (err) {
      console.log(`Status: ${colors.red(`error — ${(err as Error).message}`)}`)
    }
  },
})
