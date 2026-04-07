# cloudflare-cli Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a read-only CLI for Cloudflare analytics, logs, security events, DNS, and zone management.

**Architecture:** Bun + Bunli CLI with command groups mirroring ga-cli. Each command group has its own file under `commands/`. API interactions go through `src/cf-client.ts` which wraps the official `cloudflare` npm SDK. Auth stores an API token in `~/.config/cf-cli/token.json`.

**Tech Stack:** Bun, Bunli (`@bunli/core`), `cloudflare` SDK, Zod v4, Biome v2, Lefthook

**Note on analytics/logs APIs:** Per-zone analytics use Cloudflare's GraphQL Analytics API (`/client/v4/graphql`). HTTP request logs use the Logpull API (`/zones/:zone_id/logs/received`) which requires an Enterprise plan — we'll implement it but note the requirement. Security events use `/zones/:zone_id/security/events`.

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json` (via `bun init`)
- Create: `tsconfig.json`
- Create: `biome.json`
- Create: `lefthook.yml`
- Create: `bunli.config.ts`
- Create: `cli.ts`
- Create: `.gitignore`
- Create: `CLAUDE.md`

- [ ] **Step 1: Initialise the project**

```bash
cd ~/git/cloudflare-cli
git init
bun init -y
```

- [ ] **Step 2: Install dependencies**

```bash
cd ~/git/cloudflare-cli
bun add @bunli/core cloudflare zod@next
bun add -d @biomejs/biome lefthook typescript @types/bun
```

- [ ] **Step 3: Create `.gitignore`**

```
node_modules/
dist/
.DS_Store
```

- [ ] **Step 4: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "types": ["bun-types"],
    "lib": ["ESNext", "DOM"],
    "target": "ESNext",
    "module": "ESNext",
    "moduleDetection": "force",
    "jsx": "react-jsx",
    "allowJs": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "noEmit": true,
    "strict": true,
    "skipLibCheck": true,
    "noFallthroughCasesInSwitch": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noPropertyAccessFromIndexSignature": false
  }
}
```

- [ ] **Step 5: Create `biome.json`**

```json
{
  "$schema": "https://biomejs.dev/schemas/latest/schema.json",
  "vcs": {
    "enabled": true,
    "clientKind": "git",
    "useIgnoreFile": true
  },
  "linter": {
    "enabled": true,
    "rules": { "recommended": true }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "semicolons": "asNeeded"
    }
  },
  "assist": {
    "actions": {
      "source": {
        "organizeImports": "on"
      }
    }
  }
}
```

- [ ] **Step 6: Create `lefthook.yml`**

```yaml
pre-commit:
  parallel: true
  commands:
    biome:
      glob: "*.{js,ts,jsx,tsx,json}"
      run: npx biome check --write {staged_files}
      stage_fixed: true
    typecheck:
      run: bun run typecheck
```

- [ ] **Step 7: Create `bunli.config.ts`**

```typescript
import { defineConfig } from '@bunli/core'

export default defineConfig({
  name: 'cf',
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
```

- [ ] **Step 8: Create `cli.ts`**

```typescript
#!/usr/bin/env bun
import { createCLI } from '@bunli/core'
import authGroup from './commands/auth.ts'

const cli = await createCLI({
  name: 'cf',
  version: '0.1.0',
  description: 'Read-only CLI for Cloudflare analytics, logs, and security',
})

cli.command(authGroup)

await cli.run()
```

- [ ] **Step 9: Update `package.json` scripts and bin**

Add to `package.json`:
```json
{
  "bin": { "cf": "./cli.ts" },
  "scripts": {
    "dev": "bunli dev",
    "build": "bunli build",
    "test": "bun test",
    "typecheck": "tsc --noEmit",
    "lint": "biome check .",
    "lint:fix": "biome check --write ."
  }
}
```

- [ ] **Step 10: Create `CLAUDE.md`**

```markdown
# cf-cli

Read-only CLI for Cloudflare analytics, logs, security events, DNS, and zone management. Built with Bun + Bunli.

## Architecture

- `cli.ts` — entry point, registers command groups
- `commands/auth.ts` — auth group (login, status)
- `commands/zones.ts` — zones group (list, get)
- `commands/analytics.ts` — analytics group (traffic, bots, top)
- `commands/logs.ts` — logs group (http)
- `commands/security.ts` — security group (events, rules)
- `commands/dns.ts` — dns group (list, get)
- `src/auth.ts` — API token storage. Config at `~/.config/cf-cli/`
- `src/cf-client.ts` — Cloudflare SDK wrapper
- `src/output.ts` — shared output formatting (table/JSON)
- `bunli.config.ts` — CLI build config, targets darwin-arm64

## Command groups

### auth
- `cf auth login` — prompt for API token
- `cf auth status` — verify token and show status

### zones (flag: `-z` zone ID or domain)
- `cf zones list` — list all zones
- `cf zones get -z <zone>` — zone details and settings

### analytics (flag: `-z` zone)
- `cf analytics traffic -z <zone>` — HTTP request analytics
- `cf analytics bots -z <zone>` — bot score distribution
- `cf analytics top -z <zone> --by <dimension>` — top N by dimension

### logs (flag: `-z` zone)
- `cf logs http -z <zone>` — HTTP request logs (Enterprise only)

### security (flag: `-z` zone)
- `cf security events -z <zone>` — security/firewall events
- `cf security rules -z <zone>` — list WAF/firewall rules

### dns (flag: `-z` zone)
- `cf dns list -z <zone>` — list DNS records
- `cf dns get -z <zone> --id <record>` — single record details

All commands support `--json` / `-j`. All operations are read-only.

## Auth

API token stored at `~/.config/cf-cli/token.json`. Create a token at https://dash.cloudflare.com/profile/api-tokens with read-only permissions.

## Tech stack

- Runtime: Bun
- CLI framework: Bunli (@bunli/core)
- Cloudflare API: cloudflare (official SDK)
- Validation: Zod v4
- Linting: Biome v2
- Pre-commit: Lefthook
```

- [ ] **Step 11: Commit**

```bash
git add .gitignore package.json bun.lockb tsconfig.json biome.json lefthook.yml bunli.config.ts cli.ts CLAUDE.md
git commit -m "Initial project scaffolding: Bun + Bunli + Biome + Lefthook"
```

---

### Task 2: Auth Module + Auth Commands

**Files:**
- Create: `src/auth.ts`
- Create: `src/output.ts`
- Create: `commands/auth.ts`
- Create: `commands/auth/login.ts`
- Create: `commands/auth/status.ts`
- Modify: `cli.ts`

- [ ] **Step 1: Create `src/auth.ts`**

```typescript
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import Cloudflare from 'cloudflare'

const CONFIG_DIR = join(homedir(), '.config', 'cf-cli')
const TOKEN_PATH = join(CONFIG_DIR, 'token.json')

function ensureConfigDir() {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true })
  }
}

function loadToken(): string | null {
  if (!existsSync(TOKEN_PATH)) return null
  const content = readFileSync(TOKEN_PATH, 'utf-8')
  const data = JSON.parse(content)
  return data.apiToken ?? null
}

export function saveToken(apiToken: string) {
  ensureConfigDir()
  writeFileSync(TOKEN_PATH, JSON.stringify({ apiToken }, null, 2))
}

export function getClient(): Cloudflare {
  const token = loadToken()
  if (!token) {
    throw new Error(
      'No API token configured.\n' +
        'Run `cf auth login` to save your Cloudflare API token.',
    )
  }
  return new Cloudflare({ apiToken: token })
}

export async function verifyToken(): Promise<{ valid: boolean; status?: string }> {
  const client = getClient()
  const result = await client.user.tokens.verify()
  return { valid: result.status === 'active', status: result.status }
}

export function hasToken(): boolean {
  return loadToken() !== null
}

export { CONFIG_DIR, TOKEN_PATH }
```

- [ ] **Step 2: Create `src/output.ts`**

```typescript
export function output(data: unknown, json: boolean) {
  if (json) {
    console.log(JSON.stringify(data, null, 2))
  } else if (Array.isArray(data)) {
    if (data.length === 0) {
      console.log('No results.')
      return
    }
    for (const item of data) {
      const parts: string[] = []
      for (const [key, value] of Object.entries(item)) {
        if (value !== null && value !== undefined && typeof value !== 'object') {
          parts.push(String(value))
        }
      }
      console.log(parts.join('\t'))
    }
  } else {
    console.log(JSON.stringify(data, null, 2))
  }
}
```

- [ ] **Step 3: Create `commands/auth/login.ts`**

```typescript
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
          console.log(colors.green(`\nToken verified and saved! Status: ${status}`))
        } else {
          console.log(colors.yellow(`\nToken saved but status is: ${status}`))
        }
      } catch {
        console.log(colors.yellow('\nToken saved but could not verify. Check the token is correct.'))
      }
      break
    }
  },
})
```

- [ ] **Step 4: Create `commands/auth/status.ts`**

```typescript
import { defineCommand } from '@bunli/core'
import { CONFIG_DIR, hasToken, TOKEN_PATH, verifyToken } from '../../src/auth.ts'

export default defineCommand({
  name: 'status',
  description: 'Show current authentication status',
  handler: async ({ colors }) => {
    console.log(`Config directory: ${CONFIG_DIR}\n`)

    if (!hasToken()) {
      console.log(colors.yellow('Not authenticated.'))
      console.log('Run `cf auth login` to save your Cloudflare API token.')
      return
    }

    console.log(`Token file: ${TOKEN_PATH}`)

    try {
      const { valid, status } = await verifyToken()
      if (valid) {
        console.log(`Status: ${colors.green(status ?? 'active')}`)
      } else {
        console.log(`Status: ${colors.yellow(status ?? 'unknown')}`)
      }
    } catch (err) {
      console.log(`Status: ${colors.red(`error — ${(err as Error).message}`)}`)
    }
  },
})
```

- [ ] **Step 5: Create `commands/auth.ts`**

```typescript
import { defineGroup } from '@bunli/core'
import loginCmd from './auth/login.ts'
import statusCmd from './auth/status.ts'

export default defineGroup({
  name: 'auth',
  description: 'Authentication commands',
  commands: [loginCmd, statusCmd],
})
```

- [ ] **Step 6: Verify typecheck passes**

```bash
cd ~/git/cloudflare-cli
bun run typecheck
```

Expected: no errors.

- [ ] **Step 7: Manual test — run `cf auth login` and `cf auth status`**

```bash
cd ~/git/cloudflare-cli
bun cli.ts auth login
bun cli.ts auth status
```

Expected: login prompts for token, saves it, verifies. Status shows token file and status.

- [ ] **Step 8: Commit**

```bash
git add src/auth.ts src/output.ts commands/auth.ts commands/auth/login.ts commands/auth/status.ts
git commit -m "Add auth module and login/status commands"
```

---

### Task 3: Zones Commands

**Files:**
- Create: `commands/zones.ts`
- Create: `commands/zones/list.ts`
- Create: `commands/zones/get.ts`
- Modify: `cli.ts` — add zones group import

- [ ] **Step 1: Create `commands/zones/list.ts`**

```typescript
import { defineCommand, option } from '@bunli/core'
import { z } from 'zod/v4'
import { getClient } from '../../src/auth.ts'
import { output } from '../../src/output.ts'

export default defineCommand({
  name: 'list',
  description: 'List all zones',
  options: {
    json: option(z.coerce.boolean().default(false), {
      description: 'Output as JSON',
      short: 'j',
    }),
  },
  handler: async ({ flags }) => {
    const client = getClient()
    const zones: Array<{ id: string; name: string; status: string; plan?: string }> = []
    for await (const zone of client.zones.list()) {
      zones.push({
        id: zone.id,
        name: zone.name,
        status: zone.status,
        plan: zone.plan?.name,
      })
    }
    output(zones, flags.json)
  },
})
```

- [ ] **Step 2: Create `commands/zones/get.ts`**

```typescript
import { defineCommand, option } from '@bunli/core'
import { z } from 'zod/v4'
import { getClient } from '../../src/auth.ts'
import { output } from '../../src/output.ts'

export default defineCommand({
  name: 'get',
  description: 'Get zone details and settings',
  options: {
    zone: option(z.string(), {
      description: 'Zone ID',
      short: 'z',
      required: true,
    }),
    json: option(z.coerce.boolean().default(false), {
      description: 'Output as JSON',
      short: 'j',
    }),
  },
  handler: async ({ flags }) => {
    const client = getClient()
    const zone = await client.zones.get({ zone_id: flags.zone })
    output(zone, flags.json)
  },
})
```

- [ ] **Step 3: Create `commands/zones.ts`**

```typescript
import { defineGroup } from '@bunli/core'
import getCmd from './zones/get.ts'
import listCmd from './zones/list.ts'

export default defineGroup({
  name: 'zones',
  description: 'Zone commands',
  commands: [listCmd, getCmd],
})
```

- [ ] **Step 4: Update `cli.ts` to register zones group**

Add import and registration:
```typescript
import zonesGroup from './commands/zones.ts'
// ...
cli.command(zonesGroup)
```

- [ ] **Step 5: Verify typecheck passes**

```bash
cd ~/git/cloudflare-cli
bun run typecheck
```

- [ ] **Step 6: Manual test**

```bash
bun cli.ts zones list
bun cli.ts zones get -z <zone_id_from_list>
```

- [ ] **Step 7: Commit**

```bash
git add commands/zones.ts commands/zones/list.ts commands/zones/get.ts cli.ts
git commit -m "Add zones commands (list, get)"
```

---

### Task 4: DNS Commands

**Files:**
- Create: `commands/dns.ts`
- Create: `commands/dns/list.ts`
- Create: `commands/dns/get.ts`
- Modify: `cli.ts` — add dns group import

- [ ] **Step 1: Create `commands/dns/list.ts`**

```typescript
import { defineCommand, option } from '@bunli/core'
import { z } from 'zod/v4'
import { getClient } from '../../src/auth.ts'
import { output } from '../../src/output.ts'

export default defineCommand({
  name: 'list',
  description: 'List DNS records for a zone',
  options: {
    zone: option(z.string(), {
      description: 'Zone ID',
      short: 'z',
      required: true,
    }),
    type: option(z.string().optional(), {
      description: 'Filter by record type (A, AAAA, CNAME, MX, TXT, etc.)',
      short: 't',
    }),
    json: option(z.coerce.boolean().default(false), {
      description: 'Output as JSON',
      short: 'j',
    }),
  },
  handler: async ({ flags }) => {
    const client = getClient()
    const records: Array<{
      id: string
      type: string
      name: string
      content: string
      ttl: number
      proxied: boolean
    }> = []
    const params: { zone_id: string; type?: string } = { zone_id: flags.zone }
    if (flags.type) {
      params.type = flags.type
    }
    for await (const record of client.dns.records.list(params)) {
      records.push({
        id: record.id ?? '',
        type: record.type,
        name: record.name,
        content: record.content,
        ttl: record.ttl,
        proxied: record.proxied ?? false,
      })
    }
    output(records, flags.json)
  },
})
```

- [ ] **Step 2: Create `commands/dns/get.ts`**

```typescript
import { defineCommand, option } from '@bunli/core'
import { z } from 'zod/v4'
import { getClient } from '../../src/auth.ts'
import { output } from '../../src/output.ts'

export default defineCommand({
  name: 'get',
  description: 'Get a single DNS record',
  options: {
    zone: option(z.string(), {
      description: 'Zone ID',
      short: 'z',
      required: true,
    }),
    id: option(z.string(), {
      description: 'DNS record ID',
      required: true,
    }),
    json: option(z.coerce.boolean().default(false), {
      description: 'Output as JSON',
      short: 'j',
    }),
  },
  handler: async ({ flags }) => {
    const client = getClient()
    const record = await client.dns.records.get(flags.id, {
      zone_id: flags.zone,
    })
    output(record, flags.json)
  },
})
```

- [ ] **Step 3: Create `commands/dns.ts`**

```typescript
import { defineGroup } from '@bunli/core'
import getCmd from './dns/get.ts'
import listCmd from './dns/list.ts'

export default defineGroup({
  name: 'dns',
  description: 'DNS record commands',
  commands: [listCmd, getCmd],
})
```

- [ ] **Step 4: Update `cli.ts` to register dns group**

Add import and registration:
```typescript
import dnsGroup from './commands/dns.ts'
// ...
cli.command(dnsGroup)
```

- [ ] **Step 5: Verify typecheck and manual test**

```bash
cd ~/git/cloudflare-cli
bun run typecheck
bun cli.ts dns list -z <zone_id>
```

- [ ] **Step 6: Commit**

```bash
git add commands/dns.ts commands/dns/list.ts commands/dns/get.ts cli.ts
git commit -m "Add DNS commands (list, get)"
```

---

### Task 5: Analytics Commands

**Files:**
- Create: `src/graphql.ts`
- Create: `commands/analytics.ts`
- Create: `commands/analytics/traffic.ts`
- Create: `commands/analytics/bots.ts`
- Create: `commands/analytics/top.ts`
- Modify: `cli.ts` — add analytics group import

The Cloudflare SDK doesn't expose per-zone analytics directly. We use the GraphQL Analytics API via the SDK's raw request mechanism or direct fetch with the stored token.

- [ ] **Step 1: Create `src/graphql.ts`**

Helper for Cloudflare's GraphQL Analytics API:

```typescript
import { readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const TOKEN_PATH = join(homedir(), '.config', 'cf-cli', 'token.json')

function getToken(): string {
  const content = readFileSync(TOKEN_PATH, 'utf-8')
  const data = JSON.parse(content)
  if (!data.apiToken) throw new Error('No API token configured.')
  return data.apiToken
}

export async function graphqlQuery<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const token = getToken()
  const res = await fetch('https://api.cloudflare.com/client/v4/graphql', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  })
  if (!res.ok) {
    throw new Error(`GraphQL request failed: ${res.status} ${res.statusText}`)
  }
  const json = await res.json() as { data: T; errors?: Array<{ message: string }> }
  if (json.errors?.length) {
    throw new Error(`GraphQL errors: ${json.errors.map(e => e.message).join(', ')}`)
  }
  return json.data
}
```

- [ ] **Step 2: Create `commands/analytics/traffic.ts`**

```typescript
import { defineCommand, option } from '@bunli/core'
import { z } from 'zod/v4'
import { graphqlQuery } from '../../src/graphql.ts'
import { output } from '../../src/output.ts'

interface TrafficData {
  viewer: {
    zones: Array<{
      httpRequests1dGroups: Array<{
        dimensions: { date: string }
        sum: {
          requests: number
          bytes: number
          threats: number
          pageViews: number
        }
      }>
    }>
  }
}

export default defineCommand({
  name: 'traffic',
  description: 'HTTP request analytics for a zone',
  options: {
    zone: option(z.string(), {
      description: 'Zone ID',
      short: 'z',
      required: true,
    }),
    days: option(z.coerce.number().default(7), {
      description: 'Number of days to look back (default: 7)',
      short: 'd',
    }),
    json: option(z.coerce.boolean().default(false), {
      description: 'Output as JSON',
      short: 'j',
    }),
  },
  handler: async ({ flags }) => {
    const since = new Date()
    since.setDate(since.getDate() - flags.days)
    const sinceStr = since.toISOString().split('T')[0]

    const data = await graphqlQuery<TrafficData>(
      `query ($zoneTag: string!, $since: string!) {
        viewer {
          zones(filter: { zoneTag: $zoneTag }) {
            httpRequests1dGroups(limit: 100, filter: { date_geq: $since }, orderBy: [date_ASC]) {
              dimensions { date }
              sum { requests bytes threats pageViews }
            }
          }
        }
      }`,
      { zoneTag: flags.zone, since: sinceStr },
    )

    const rows = (data.viewer.zones[0]?.httpRequests1dGroups ?? []).map(g => ({
      date: g.dimensions.date,
      requests: g.sum.requests,
      bytes: g.sum.bytes,
      threats: g.sum.threats,
      pageViews: g.sum.pageViews,
    }))

    output(rows, flags.json)
  },
})
```

- [ ] **Step 3: Create `commands/analytics/bots.ts`**

```typescript
import { defineCommand, option } from '@bunli/core'
import { z } from 'zod/v4'
import { graphqlQuery } from '../../src/graphql.ts'
import { output } from '../../src/output.ts'

interface BotData {
  viewer: {
    zones: Array<{
      httpRequests1dGroups: Array<{
        dimensions: { botManagementDecision: string }
        sum: { requests: number }
      }>
    }>
  }
}

export default defineCommand({
  name: 'bots',
  description: 'Bot score distribution for a zone',
  options: {
    zone: option(z.string(), {
      description: 'Zone ID',
      short: 'z',
      required: true,
    }),
    days: option(z.coerce.number().default(7), {
      description: 'Number of days to look back (default: 7)',
      short: 'd',
    }),
    json: option(z.coerce.boolean().default(false), {
      description: 'Output as JSON',
      short: 'j',
    }),
  },
  handler: async ({ flags }) => {
    const since = new Date()
    since.setDate(since.getDate() - flags.days)
    const sinceStr = since.toISOString().split('T')[0]

    const data = await graphqlQuery<BotData>(
      `query ($zoneTag: string!, $since: string!) {
        viewer {
          zones(filter: { zoneTag: $zoneTag }) {
            httpRequests1dGroups(limit: 100, filter: { date_geq: $since }) {
              dimensions { botManagementDecision }
              sum { requests }
            }
          }
        }
      }`,
      { zoneTag: flags.zone, since: sinceStr },
    )

    const rows = (data.viewer.zones[0]?.httpRequests1dGroups ?? []).map(g => ({
      classification: g.dimensions.botManagementDecision,
      requests: g.sum.requests,
    }))

    output(rows, flags.json)
  },
})
```

- [ ] **Step 4: Create `commands/analytics/top.ts`**

```typescript
import { defineCommand, option } from '@bunli/core'
import { z } from 'zod/v4'
import { graphqlQuery } from '../../src/graphql.ts'
import { output } from '../../src/output.ts'

const DIMENSION_MAP: Record<string, { node: string; field: string }> = {
  ip: { node: 'httpRequestsAdaptiveGroups', field: 'clientIP' },
  country: { node: 'httpRequestsAdaptiveGroups', field: 'clientCountryName' },
  ua: { node: 'httpRequestsAdaptiveGroups', field: 'userAgent' },
  path: { node: 'httpRequestsAdaptiveGroups', field: 'clientRequestPath' },
}

export default defineCommand({
  name: 'top',
  description: 'Top N items by dimension (ip, ua, country, path)',
  options: {
    zone: option(z.string(), {
      description: 'Zone ID',
      short: 'z',
      required: true,
    }),
    by: option(z.enum(['ip', 'ua', 'country', 'path']), {
      description: 'Dimension to group by',
      required: true,
    }),
    limit: option(z.coerce.number().default(10), {
      description: 'Number of results (default: 10)',
      short: 'n',
    }),
    days: option(z.coerce.number().default(7), {
      description: 'Number of days to look back (default: 7)',
      short: 'd',
    }),
    json: option(z.coerce.boolean().default(false), {
      description: 'Output as JSON',
      short: 'j',
    }),
  },
  handler: async ({ flags }) => {
    const dim = DIMENSION_MAP[flags.by]
    const since = new Date()
    since.setDate(since.getDate() - flags.days)
    const sinceStr = since.toISOString().split('T')[0]
    const untilStr = new Date().toISOString().split('T')[0]

    const query = `query ($zoneTag: string!, $since: string!, $until: string!, $limit: Int!) {
      viewer {
        zones(filter: { zoneTag: $zoneTag }) {
          ${dim.node}(
            limit: $limit
            filter: { date_geq: $since, date_leq: $until }
            orderBy: [count_DESC]
          ) {
            count
            dimensions { ${dim.field} }
          }
        }
      }
    }`

    const data = await graphqlQuery<{
      viewer: {
        zones: Array<{
          [key: string]: Array<{
            count: number
            dimensions: Record<string, string>
          }>
        }>
      }
    }>(query, { zoneTag: flags.zone, since: sinceStr, until: untilStr, limit: flags.limit })

    const groups = data.viewer.zones[0]?.[dim.node] ?? []
    const rows = groups.map((g: { count: number; dimensions: Record<string, string> }) => ({
      [flags.by]: g.dimensions[dim.field],
      count: g.count,
    }))

    output(rows, flags.json)
  },
})
```

- [ ] **Step 5: Create `commands/analytics.ts`**

```typescript
import { defineGroup } from '@bunli/core'
import botsCmd from './analytics/bots.ts'
import topCmd from './analytics/top.ts'
import trafficCmd from './analytics/traffic.ts'

export default defineGroup({
  name: 'analytics',
  description: 'Traffic and bot analytics',
  commands: [trafficCmd, botsCmd, topCmd],
})
```

- [ ] **Step 6: Update `cli.ts` to register analytics group**

Add import and registration:
```typescript
import analyticsGroup from './commands/analytics.ts'
// ...
cli.command(analyticsGroup)
```

- [ ] **Step 7: Verify typecheck and manual test**

```bash
cd ~/git/cloudflare-cli
bun run typecheck
bun cli.ts analytics traffic -z <zone_id>
bun cli.ts analytics bots -z <zone_id>
bun cli.ts analytics top -z <zone_id> --by ip
```

- [ ] **Step 8: Commit**

```bash
git add src/graphql.ts commands/analytics.ts commands/analytics/traffic.ts commands/analytics/bots.ts commands/analytics/top.ts cli.ts
git commit -m "Add analytics commands (traffic, bots, top)"
```

---

### Task 6: Security Commands

**Files:**
- Create: `commands/security.ts`
- Create: `commands/security/events.ts`
- Create: `commands/security/rules.ts`
- Modify: `cli.ts` — add security group import

- [ ] **Step 1: Create `commands/security/events.ts`**

Security events use the GraphQL Analytics API with `firewallEventsAdaptive`:

```typescript
import { defineCommand, option } from '@bunli/core'
import { z } from 'zod/v4'
import { graphqlQuery } from '../../src/graphql.ts'
import { output } from '../../src/output.ts'

interface SecurityEventsData {
  viewer: {
    zones: Array<{
      firewallEventsAdaptive: Array<{
        action: string
        source: string
        clientIP: string
        clientRequestHTTPHost: string
        clientRequestPath: string
        clientRequestHTTPMethodName: string
        datetime: string
        userAgent: string
        ruleId: string
      }>
    }>
  }
}

export default defineCommand({
  name: 'events',
  description: 'Security and firewall events',
  options: {
    zone: option(z.string(), {
      description: 'Zone ID',
      short: 'z',
      required: true,
    }),
    action: option(z.string().optional(), {
      description: 'Filter by action (block, challenge, jschallenge, managedChallenge, log)',
    }),
    source: option(z.string().optional(), {
      description: 'Filter by source (waf, firewallRules, rateLimit, botManagement, etc.)',
    }),
    ip: option(z.string().optional(), {
      description: 'Filter by client IP',
    }),
    limit: option(z.coerce.number().default(25), {
      description: 'Number of results (default: 25)',
      short: 'n',
    }),
    hours: option(z.coerce.number().default(24), {
      description: 'Hours to look back (default: 24)',
    }),
    json: option(z.coerce.boolean().default(false), {
      description: 'Output as JSON',
      short: 'j',
    }),
  },
  handler: async ({ flags }) => {
    const since = new Date(Date.now() - flags.hours * 60 * 60 * 1000).toISOString()

    const filters: string[] = [`datetime_geq: $since`]
    const vars: Record<string, unknown> = { zoneTag: flags.zone, since, limit: flags.limit }

    if (flags.action) {
      filters.push(`action: $action`)
      vars.action = flags.action
    }
    if (flags.source) {
      filters.push(`source: $source`)
      vars.source = flags.source
    }
    if (flags.ip) {
      filters.push(`clientIP: $ip`)
      vars.ip = flags.ip
    }

    const varDefs = [
      '$zoneTag: string!',
      '$since: string!',
      '$limit: Int!',
      flags.action ? '$action: string!' : '',
      flags.source ? '$source: string!' : '',
      flags.ip ? '$ip: string!' : '',
    ].filter(Boolean).join(', ')

    const data = await graphqlQuery<SecurityEventsData>(
      `query (${varDefs}) {
        viewer {
          zones(filter: { zoneTag: $zoneTag }) {
            firewallEventsAdaptive(
              limit: $limit
              filter: { ${filters.join(', ')} }
              orderBy: [datetime_DESC]
            ) {
              action
              source
              clientIP
              clientRequestHTTPHost
              clientRequestPath
              clientRequestHTTPMethodName
              datetime
              userAgent
              ruleId
            }
          }
        }
      }`,
      vars,
    )

    const events = (data.viewer.zones[0]?.firewallEventsAdaptive ?? []).map(e => ({
      datetime: e.datetime,
      action: e.action,
      source: e.source,
      ip: e.clientIP,
      method: e.clientRequestHTTPMethodName,
      path: e.clientRequestPath,
      ruleId: e.ruleId,
    }))

    output(events, flags.json)
  },
})
```

- [ ] **Step 2: Create `commands/security/rules.ts`**

```typescript
import { defineCommand, option } from '@bunli/core'
import { z } from 'zod/v4'
import { getClient } from '../../src/auth.ts'
import { output } from '../../src/output.ts'

export default defineCommand({
  name: 'rules',
  description: 'List WAF/firewall rulesets',
  options: {
    zone: option(z.string(), {
      description: 'Zone ID',
      short: 'z',
      required: true,
    }),
    json: option(z.coerce.boolean().default(false), {
      description: 'Output as JSON',
      short: 'j',
    }),
  },
  handler: async ({ flags }) => {
    const client = getClient()
    const rulesets: Array<{ id: string; name: string; kind: string; phase: string }> = []
    for await (const ruleset of client.rulesets.list({ zone_id: flags.zone })) {
      rulesets.push({
        id: ruleset.id,
        name: ruleset.name ?? '',
        kind: ruleset.kind,
        phase: ruleset.phase,
      })
    }
    output(rulesets, flags.json)
  },
})
```

- [ ] **Step 3: Create `commands/security.ts`**

```typescript
import { defineGroup } from '@bunli/core'
import eventsCmd from './security/events.ts'
import rulesCmd from './security/rules.ts'

export default defineGroup({
  name: 'security',
  description: 'Security events and firewall rules',
  commands: [eventsCmd, rulesCmd],
})
```

- [ ] **Step 4: Update `cli.ts` to register security group**

Add import and registration:
```typescript
import securityGroup from './commands/security.ts'
// ...
cli.command(securityGroup)
```

- [ ] **Step 5: Verify typecheck and manual test**

```bash
cd ~/git/cloudflare-cli
bun run typecheck
bun cli.ts security events -z <zone_id>
bun cli.ts security rules -z <zone_id>
```

- [ ] **Step 6: Commit**

```bash
git add commands/security.ts commands/security/events.ts commands/security/rules.ts cli.ts
git commit -m "Add security commands (events, rules)"
```

---

### Task 7: Logs Commands

**Files:**
- Create: `commands/logs.ts`
- Create: `commands/logs/http.ts`
- Modify: `cli.ts` — add logs group import

Note: The Logpull API (`/zones/:zone_id/logs/received`) requires an Enterprise plan. We implement it and surface a clear error if the plan doesn't support it.

- [ ] **Step 1: Create `commands/logs/http.ts`**

```typescript
import { readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { defineCommand, option } from '@bunli/core'
import { z } from 'zod/v4'
import { output } from '../../src/output.ts'

const TOKEN_PATH = join(homedir(), '.config', 'cf-cli', 'token.json')

const DEFAULT_FIELDS = [
  'ClientIP',
  'ClientRequestHost',
  'ClientRequestMethod',
  'ClientRequestURI',
  'EdgeResponseStatus',
  'EdgeStartTimestamp',
  'ClientRequestUserAgent',
  'BotScore',
  'BotScoreSrc',
].join(',')

export default defineCommand({
  name: 'http',
  description: 'HTTP request logs (Enterprise plan required)',
  options: {
    zone: option(z.string(), {
      description: 'Zone ID',
      short: 'z',
      required: true,
    }),
    minutes: option(z.coerce.number().default(5), {
      description: 'Minutes to look back (default: 5, max: 60)',
      short: 'm',
    }),
    limit: option(z.coerce.number().default(100), {
      description: 'Number of results (default: 100)',
      short: 'n',
    }),
    ip: option(z.string().optional(), {
      description: 'Filter by client IP (post-fetch)',
    }),
    ua: option(z.string().optional(), {
      description: 'Filter by user agent substring (post-fetch)',
    }),
    status: option(z.coerce.number().optional(), {
      description: 'Filter by HTTP status code (post-fetch)',
    }),
    path: option(z.string().optional(), {
      description: 'Filter by request path substring (post-fetch)',
    }),
    method: option(z.string().optional(), {
      description: 'Filter by HTTP method (post-fetch)',
    }),
    'bot-score': option(z.coerce.number().optional(), {
      description: 'Filter by max bot score (post-fetch, lower = more bot-like)',
    }),
    json: option(z.coerce.boolean().default(false), {
      description: 'Output as JSON',
      short: 'j',
    }),
  },
  handler: async ({ flags }) => {
    const content = readFileSync(TOKEN_PATH, 'utf-8')
    const { apiToken } = JSON.parse(content)
    if (!apiToken) throw new Error('No API token configured. Run `cf auth login`.')

    const end = new Date()
    const start = new Date(end.getTime() - flags.minutes * 60 * 1000)

    const url = new URL(`https://api.cloudflare.com/client/v4/zones/${flags.zone}/logs/received`)
    url.searchParams.set('start', start.toISOString())
    url.searchParams.set('end', end.toISOString())
    url.searchParams.set('fields', DEFAULT_FIELDS)
    url.searchParams.set('sample', '1')
    url.searchParams.set('count', String(flags.limit))

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${apiToken}` },
    })

    if (!res.ok) {
      if (res.status === 403) {
        throw new Error('Logpull API requires an Enterprise plan.')
      }
      throw new Error(`Logpull request failed: ${res.status} ${res.statusText}`)
    }

    const text = await res.text()
    let logs = text
      .trim()
      .split('\n')
      .filter(Boolean)
      .map(line => JSON.parse(line))

    // Post-fetch filters
    if (flags.ip) {
      logs = logs.filter(l => l.ClientIP === flags.ip)
    }
    if (flags.ua) {
      const ua = flags.ua.toLowerCase()
      logs = logs.filter(l => l.ClientRequestUserAgent?.toLowerCase().includes(ua))
    }
    if (flags.status) {
      logs = logs.filter(l => l.EdgeResponseStatus === flags.status)
    }
    if (flags.path) {
      logs = logs.filter(l => l.ClientRequestURI?.includes(flags.path))
    }
    if (flags.method) {
      const m = flags.method.toUpperCase()
      logs = logs.filter(l => l.ClientRequestMethod === m)
    }
    if (flags['bot-score'] !== undefined) {
      logs = logs.filter(l => l.BotScore !== undefined && l.BotScore <= flags['bot-score']!)
    }

    const rows = logs.map(l => ({
      time: l.EdgeStartTimestamp,
      status: l.EdgeResponseStatus,
      method: l.ClientRequestMethod,
      path: l.ClientRequestURI,
      ip: l.ClientIP,
      ua: l.ClientRequestUserAgent,
      botScore: l.BotScore,
    }))

    output(rows, flags.json)
  },
})
```

- [ ] **Step 2: Create `commands/logs.ts`**

```typescript
import { defineGroup } from '@bunli/core'
import httpCmd from './logs/http.ts'

export default defineGroup({
  name: 'logs',
  description: 'HTTP request logs',
  commands: [httpCmd],
})
```

- [ ] **Step 3: Update `cli.ts` to register logs group**

Add import and registration:
```typescript
import logsGroup from './commands/logs.ts'
// ...
cli.command(logsGroup)
```

- [ ] **Step 4: Verify typecheck and manual test**

```bash
cd ~/git/cloudflare-cli
bun run typecheck
bun cli.ts logs http -z <zone_id>
```

Expected: either log data or "Logpull API requires an Enterprise plan." error.

- [ ] **Step 5: Commit**

```bash
git add commands/logs.ts commands/logs/http.ts cli.ts
git commit -m "Add logs commands (http request logs via Logpull)"
```

---

### Task 8: Final Wiring + Lint + README

**Files:**
- Verify: `cli.ts` has all groups registered
- Create: `README.md`
- Run: lint + typecheck

- [ ] **Step 1: Verify `cli.ts` has all command groups**

Final `cli.ts` should be:

```typescript
#!/usr/bin/env bun
import { createCLI } from '@bunli/core'
import analyticsGroup from './commands/analytics.ts'
import authGroup from './commands/auth.ts'
import dnsGroup from './commands/dns.ts'
import logsGroup from './commands/logs.ts'
import securityGroup from './commands/security.ts'
import zonesGroup from './commands/zones.ts'

const cli = await createCLI({
  name: 'cf',
  version: '0.1.0',
  description: 'Read-only CLI for Cloudflare analytics, logs, and security',
})

cli.command(authGroup)
cli.command(analyticsGroup)
cli.command(dnsGroup)
cli.command(logsGroup)
cli.command(securityGroup)
cli.command(zonesGroup)

await cli.run()
```

- [ ] **Step 2: Run lint and fix**

```bash
cd ~/git/cloudflare-cli
bun run lint:fix
bun run typecheck
```

Fix any issues.

- [ ] **Step 3: Create `README.md`**

```markdown
# cf-cli

Read-only CLI for Cloudflare analytics, logs, security events, DNS, and zone management.

## Setup

1. Create a Cloudflare API token at https://dash.cloudflare.com/profile/api-tokens with these permissions:

   | Scope   | Permission             | Level |
   | ------- | ---------------------- | ----- |
   | Zone    | Analytics              | Read  |
   | Zone    | Logs                   | Read  |
   | Zone    | Zone                   | Read  |
   | Zone    | DNS                    | Read  |
   | Zone    | Firewall Services      | Read  |
   | Account | Account Analytics      | Read  |
   | Account | Workers Observability  | Read  |

2. Save the token:

   ```bash
   cf auth login
   ```

## Commands

```
cf auth login          # Save API token
cf auth status         # Verify token

cf zones list          # List all zones
cf zones get -z ZONE   # Zone details

cf analytics traffic -z ZONE           # HTTP request analytics
cf analytics bots -z ZONE              # Bot score distribution
cf analytics top -z ZONE --by ip       # Top N by dimension

cf logs http -z ZONE                   # HTTP request logs (Enterprise)

cf security events -z ZONE             # Security/firewall events
cf security rules -z ZONE              # List WAF rulesets

cf dns list -z ZONE                    # List DNS records
cf dns get -z ZONE --id RECORD_ID      # Single record details
```

All commands support `--json` / `-j` for JSON output.
```

- [ ] **Step 4: Commit**

```bash
git add cli.ts README.md
git commit -m "Final wiring, README, and lint fixes"
```
