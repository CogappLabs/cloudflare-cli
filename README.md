# cf-cli

Read-only CLI for Cloudflare analytics, logs, security events, DNS, and zone management.

## Setup

1. Go to https://dash.cloudflare.com/profile/api-tokens
2. Click **Create Token** → **Create Custom Token**
3. Name it something like "Read analytics and logs"
4. Add these permissions (all **Read**):

   | Scope   | Permission             | Level |
   | ------- | ---------------------- | ----- |
   | Account | Workers Observability  | Read  |
   | Account | Intel                  | Read  |
   | Account | Account Analytics      | Read  |
   | Zone    | Zone WAF               | Read  |
   | Zone    | Zone                   | Read  |
   | Zone    | DNS                    | Read  |
   | Zone    | Logs                   | Read  |
   | Zone    | Firewall Services      | Read  |
   | Zone    | Analytics              | Read  |

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
