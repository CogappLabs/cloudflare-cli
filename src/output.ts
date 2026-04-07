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
      for (const [_key, value] of Object.entries(item)) {
        if (
          value !== null &&
          value !== undefined &&
          typeof value !== 'object'
        ) {
          parts.push(String(value))
        }
      }
      console.log(parts.join('\t'))
    }
  } else {
    console.log(JSON.stringify(data, null, 2))
  }
}
