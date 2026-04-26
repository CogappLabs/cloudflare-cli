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
- `cf security events -z <zone>` — security/firewall events (includes userAgent)
- `cf security allowed -z <zone>` — allowed-through traffic grouped by IP + user agent, ordered by request count (uses `httpRequestsAdaptiveGroups`)
- `cf security rules -z <zone>` — list WAF/firewall rulesets
- `cf security rules -z <zone> --id <ruleset>` — show individual rules within a ruleset (ID, description, action, expression, enabled)

### intel
- `cf intel ip --ip <ipv4|ipv6>` — IP intelligence: threat risk types, ASN, country, infrastructure type (hosting_provider/isp/organization). Gets account ID from first zone.

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
