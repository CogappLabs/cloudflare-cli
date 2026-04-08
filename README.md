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
cf security allowed -z ZONE            # Allowed-through traffic (high volume first)
cf security rules -z ZONE              # List WAF rulesets

cf intel ip --ip 1.2.3.4               # IP intelligence (threat, ASN, geo)

cf dns list -z ZONE                    # List DNS records
cf dns get -z ZONE --id RECORD_ID      # Single record details
```

All commands support `--json` / `-j` for JSON output.
