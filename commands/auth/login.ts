import { defineCommand } from '@bunli/core'
import { saveToken, verifyToken } from '../../src/auth.ts'

export default defineCommand({
  name: 'login',
  description: 'Save your Cloudflare API token',
  handler: async ({ colors }) => {
    process.stdout.write('Enter your Cloudflare API token: ')
    for await (const line of console) {
      const token = line.trim()
      if (!token) {
        console.error(colors.red('No token provided.'))
        process.exit(1)
      }

      saveToken(token)

      try {
        const { valid, status } = await verifyToken()
        if (valid) {
          console.log(
            colors.green(`\nToken verified and saved! Status: ${status}`),
          )
        } else {
          console.log(colors.yellow(`\nToken saved but status is: ${status}`))
        }
      } catch {
        console.log(
          colors.yellow(
            '\nToken saved but could not verify. Check the token is correct.',
          ),
        )
      }
      break
    }
  },
})
