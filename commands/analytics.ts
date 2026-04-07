import { defineGroup } from '@bunli/core'
import botsCmd from './analytics/bots.ts'
import topCmd from './analytics/top.ts'
import trafficCmd from './analytics/traffic.ts'

export default defineGroup({
  name: 'analytics',
  description: 'Traffic and bot analytics',
  commands: [trafficCmd, botsCmd, topCmd],
})
