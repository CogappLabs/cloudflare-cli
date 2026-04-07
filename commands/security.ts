import { defineGroup } from '@bunli/core'
import eventsCmd from './security/events.ts'
import rulesCmd from './security/rules.ts'

export default defineGroup({
  name: 'security',
  description: 'Security events and firewall rules',
  commands: [eventsCmd, rulesCmd],
})
