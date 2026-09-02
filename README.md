# cf-cli

Read-only CLI for Cloudflare analytics, logs, security events, DNS, and zone management.

## Setup

1. Go to https://dash.cloudflare.com/profile/api-tokens
2. Click **Create Token** → **Create Custom Token**
3. Name it something like "Read analytics and logs"
4. Add these permissions (all **Read**):

   | Scope   | Permission        | Level | Needed by                                             |
   | ------- | ----------------- | ----- | ----------------------------------------------------- |
   | Account | Intel             | Read  | `intel ip`                                            |
   | Zone    | Zone              | Read  | `zones list`, `zones get`, `intel ip`                 |
   | Zone    | DNS               | Read  | `dns list`, `dns get`                                 |
   | Zone    | Analytics         | Read  | `analytics traffic`, `analytics top`, `security allowed` |
   | Zone    | Zone WAF          | Read  | `security rules`                                      |
   | Zone    | Logs              | Read  | `logs http`, `analytics bots`, `security events`      |
   | Zone    | Firewall Services | Read  | `security events` (see note)                          |

   `auth status` calls the token-verify endpoint, which any token can call on
   itself, so it needs no permission of its own.

   Firewall Services is not used by any REST call here (`security rules` uses
   the modern Rulesets API, under Zone WAF). Cloudflare's GraphQL gating on the
   `firewallEventsAdaptive` dataset is inconsistent, so it is kept to avoid a
   confusing 403 on `analytics bots` / `security events`.

5. Under **Zone Resources**, select **Include** → **All zones** (or specific zones)
6. Click **Continue to summary** → **Create Token**
7. Copy the token and save it:

   ```bash
   cfa auth login
   ```

   The token is stored at `~/.config/cf-cli/token.json`. Alternatively, set the `CF_API_KEY` environment variable.

## Commands

```
cfa auth login          # Save API token
cfa auth status         # Verify token

cfa zones list          # List all zones
cfa zones get -z ZONE   # Zone details

cfa analytics traffic -z ZONE           # HTTP request analytics
cfa analytics bots -z ZONE              # Bot score distribution
cfa analytics top -z ZONE --by ip       # Top N by dimension

cfa logs http -z ZONE                   # HTTP request logs (Enterprise)

cfa security events -z ZONE             # Security/firewall events
cfa security allowed -z ZONE            # Allowed-through traffic (high volume first)
cfa security rules -z ZONE              # List WAF rulesets
cfa security rules -z ZONE --id RULESET # Show individual rules in a ruleset (rate limit rules include requests, period, characteristics)

cfa intel ip --ip 1.2.3.4               # IP intelligence (threat, ASN, geo)

cfa dns list -z ZONE                    # List DNS records
cfa dns get -z ZONE --id RECORD_ID      # Single record details
```

All commands support `--json` / `-j` for JSON output.
