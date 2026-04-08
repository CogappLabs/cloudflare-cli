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
   cf auth login
   ```

   The token is stored at `~/.config/cf-cli/token.json`. Alternatively, set the `CF_API_KEY` environment variable.

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
cf security allowed -z ZONE            # Allowed-through traffic (high volume first)
cf security rules -z ZONE              # List WAF rulesets

cf intel ip --ip 1.2.3.4               # IP intelligence (threat, ASN, geo)

cf dns list -z ZONE                    # List DNS records
cf dns get -z ZONE --id RECORD_ID      # Single record details
```

All commands support `--json` / `-j` for JSON output.
