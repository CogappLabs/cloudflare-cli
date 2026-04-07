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

export async function graphqlQuery<T>(
  query: string,
  variables: Record<string, unknown> = {},
): Promise<T> {
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
  const json = (await res.json()) as {
    data: T
    errors?: Array<{ message: string }>
  }
  if (json.errors?.length) {
    throw new Error(
      `GraphQL errors: ${json.errors.map((e) => e.message).join(', ')}`,
    )
  }
  return json.data
}
