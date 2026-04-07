import { defineGroup } from '@bunli/core'
import httpCmd from './logs/http.ts'

export default defineGroup({
  name: 'logs',
  description: 'HTTP request logs',
  commands: [httpCmd],
})
