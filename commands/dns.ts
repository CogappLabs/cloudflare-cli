import { defineGroup } from '@bunli/core'
import getCmd from './dns/get.ts'
import listCmd from './dns/list.ts'

export default defineGroup({
  name: 'dns',
  description: 'DNS record commands',
  commands: [listCmd, getCmd],
})
