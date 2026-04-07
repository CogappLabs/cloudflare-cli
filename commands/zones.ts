import { defineGroup } from '@bunli/core'
import getCmd from './zones/get.ts'
import listCmd from './zones/list.ts'

export default defineGroup({
  name: 'zones',
  description: 'Zone commands',
  commands: [listCmd, getCmd],
})
