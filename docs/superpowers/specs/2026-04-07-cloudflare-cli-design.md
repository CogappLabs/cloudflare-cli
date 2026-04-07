# cloudflare-cli Design Spec

Read-only CLI for Cloudflare analytics, logs, security events, DNS, and zone management. Built with Bun + Bunli, mirroring ga-cli's architecture. Uses the official `cloudflare` npm SDK.

## Auth

- Config dir: `~/.config/cf-cli/`
- `token.json` stores `{ "apiToken": "..." }`
- `cf auth login` — prompts for API token, saves it
- `cf auth status` — verifies token against Cloudflare's `/user/tokens/verify` endpoint

### Required API Token Permissions

| Scope   | Permission             | Level |
| ------- | ---------------------- | ----- |
| Zone    | Analytics              | Read  |
| Zone    | Logs                   | Read  |
| Zone    | Zone                   | Read  |
| Zone    | DNS                    | Read  |
| Zone    | Firewall Services      | Read  |
| Account | Account Analytics      | Read  |
| Account | Workers Observability  | Read  |

## Command Groups

### auth

- `cf auth login` — prompts for API token, saves to `~/.config/cf-cli/token.json`
- `cf auth status` — verifies token and shows current auth state

### zones (flag: `-z` zone ID or domain)

- `cf zones list` — list all zones
- `cf zones get -z <zone>` — zone details and settings

### analytics (flag: `-z` zone)

- `cf analytics traffic -z <zone>` — HTTP request analytics (requests, bandwidth, threats, by time period)
- `cf analytics bots -z <zone>` — bot score distribution, verified bot vs automated vs likely human
- `cf analytics top -z <zone> --by <ip|ua|country|path>` — top N by dimension

### logs (flag: `-z` zone)

- `cf logs http -z <zone>` — HTTP request logs with filters: `--ua`, `--ip`, `--bot-score`, `--threat-score`, `--status`, `--path`, `--method`, `--limit`

### security (flag: `-z` zone)

- `cf security events -z <zone>` — security events/firewall events with filters: `--action`, `--source`, `--ip`, `--limit`
- `cf security rules -z <zone>` — list WAF/firewall rules

### dns (flag: `-z` zone)

- `cf dns list -z <zone>` — list DNS records
- `cf dns get -z <zone> --id <record>` — single record details

## Architecture

```
cf-cli/
├── cli.ts                    # Entry point, registers command groups
├── bunli.config.ts           # Bunli build config (darwin-arm64)
├── commands/
│   ├── auth.ts               # auth group (login, status)
│   ├── zones.ts              # zones group (list, get)
│   ├── analytics.ts          # analytics group (traffic, bots, top)
│   ├── logs.ts               # logs group (http)
│   ├── security.ts           # security group (events, rules)
│   └── dns.ts                # dns group (list, get)
├── src/
│   ├── auth.ts               # Token storage, load, save, config dir management
│   ├── cf-client.ts          # Cloudflare SDK wrapper, creates authenticated client
│   └── output.ts             # Shared table/JSON output formatting
├── package.json
├── tsconfig.json
├── biome.json
└── lefthook.yml
```

## Tech Stack

- Runtime: Bun
- CLI framework: Bunli (`@bunli/core`)
- Cloudflare API: `cloudflare` (official SDK)
- Validation: Zod v4
- Linting: Biome v2
- Pre-commit: Lefthook

## Output

All commands support `--json` / `-j`. Default is human-readable table output.

## Principles

- All operations are read-only — enforced by API token scopes
- Mirrors ga-cli patterns: command groups, API client wrappers in `src/`, shared output formatting
- CLI name: `cf`, binary entry point: `cli.ts`
