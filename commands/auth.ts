import { defineGroup } from '@bunli/core'
import loginCmd from './auth/login.ts'
import statusCmd from './auth/status.ts'

export default defineGroup({
  name: 'auth',
  description: 'Authentication commands',
  commands: [loginCmd, statusCmd],
})
