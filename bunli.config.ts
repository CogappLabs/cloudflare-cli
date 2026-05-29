import { defineConfig } from '@bunli/core'

export default defineConfig({
  name: 'cfa',
  version: '0.1.0',
  commands: {
    directory: './commands',
  },
  build: {
    entry: './cli.ts',
    outdir: './dist',
    targets: ['darwin-arm64'],
    minify: true,
  },
})
