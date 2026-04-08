import { defineGroup } from '@bunli/core'
import allowedCmd from './security/allowed.ts'
import eventsCmd from './security/events.ts'
import rulesCmd from './security/rules.ts'

export default defineGroup({
  name: 'security',
  description: 'Security events and firewall rules',
  commands: [allowedCmd, eventsCmd, rulesCmd],
})
