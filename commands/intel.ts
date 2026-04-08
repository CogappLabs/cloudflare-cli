import { defineGroup } from '@bunli/core'
import ipCmd from './intel/ip.ts'

export default defineGroup({
  name: 'intel',
  description: 'IP and domain intelligence',
  commands: [ipCmd],
})
