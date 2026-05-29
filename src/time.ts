/**
 * Parse a time spec into a Date.
 *
 * Accepts:
 *   - ISO-8601 absolute: "2026-05-21T15:50Z", "2026-05-21T15:50:00.000Z"
 *   - Date only: "2026-05-21" (treated as 00:00 UTC)
 *   - Relative shorthand: "30m", "2h", "1d", "1w" (interpreted as "ago" when used for --since)
 *   - "now"
 */
export function parseTimeSpec(spec: string, now: Date = new Date()): Date {
  const trimmed = spec.trim()

  if (trimmed === 'now') return new Date(now)

  // Relative: <num><unit> where unit is m|h|d|w
  const rel = /^(\d+)\s*([mhdw])$/i.exec(trimmed)
  if (rel) {
    const n = Number(rel[1])
    const unit = rel[2].toLowerCase()
    const ms =
      unit === 'm'
        ? n * 60_000
        : unit === 'h'
          ? n * 3_600_000
          : unit === 'd'
            ? n * 86_400_000
            : n * 7 * 86_400_000
    return new Date(now.getTime() - ms)
  }

  // Date-only -> 00:00 UTC
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return new Date(`${trimmed}T00:00:00Z`)
  }

  // ISO-ish — let Date constructor handle. If missing TZ, treat as UTC.
  const hasTz = /[zZ]|[+-]\d{2}:?\d{2}$/.test(trimmed)
  const normalised = hasTz ? trimmed : `${trimmed}Z`
  const d = new Date(normalised)
  if (Number.isNaN(d.getTime())) {
    throw new Error(
      `Invalid time spec: "${spec}". Use ISO ("2026-05-21T15:50Z"), date ("2026-05-21"), relative ("2h", "30m", "1d", "1w"), or "now".`,
    )
  }
  return d
}

/**
 * Resolve a time window from CLI flags.
 *
 * Precedence:
 *   - If `since` provided, parse it. Otherwise fall back to `hours`/`minutes` ago.
 *   - If `until` provided, parse it. Otherwise now.
 *
 * Returns ISO strings ready for GraphQL.
 */
export function resolveWindow(opts: {
  since?: string
  until?: string
  hours?: number
  minutes?: number
}): { since: string; until: string; sinceDate: Date; untilDate: Date } {
  const now = new Date()
  const untilDate = opts.until ? parseTimeSpec(opts.until, now) : now

  let sinceDate: Date
  if (opts.since) {
    sinceDate = parseTimeSpec(opts.since, untilDate)
  } else {
    const ms =
      opts.hours !== undefined
        ? opts.hours * 3_600_000
        : opts.minutes !== undefined
          ? opts.minutes * 60_000
          : 60 * 60_000
    sinceDate = new Date(untilDate.getTime() - ms)
  }

  if (sinceDate >= untilDate) {
    throw new Error(
      `Time window is empty or inverted: since=${sinceDate.toISOString()} until=${untilDate.toISOString()}`,
    )
  }

  return {
    since: sinceDate.toISOString(),
    until: untilDate.toISOString(),
    sinceDate,
    untilDate,
  }
}
