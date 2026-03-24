import { userAgents, type Endpoints } from '#common/constants'
import type { ApiContextEnum } from '#common/enums'

type EndpointValue = (typeof Endpoints)[keyof typeof Endpoints]

interface FetchParams {
  endpoint: EndpointValue
  params: Record<string, string | number>
  context?: ApiContextEnum
}

interface FetchResponse<T> {
  data: T
  ok: Response['ok']
}

export const useFetch = async <T>({ endpoint, params, context }: FetchParams): Promise<FetchResponse<T>> => {
  const url = new URL('https://www.jiosaavn.com/api.php')

  url.searchParams.append('__call', endpoint.toString())
  url.searchParams.append('_format', 'json')
  url.searchParams.append('_marker', '0')
  url.searchParams.append('api_version', '4')
  url.searchParams.append('ctx', context || 'web6dot0')

  Object.keys(params).forEach((key) => url.searchParams.append(key, String(params[key])))

  const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)]

  // Remove all JioSaavn/Sumit headers, only send minimal headers
  const response = await fetch(url.toString(), {
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': randomUserAgent,
      Accept: 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9,*;q=0.8'
    }
  })

  const body = await response.text()

  if (!response.ok) {
    console.error('[useFetch] upstream request failed', {
      endpoint,
      status: response.status,
      bodySnippet: body.slice(0, 200)
    })

    throw new Error(`upstream request failed with status ${response.status}`)
  }

  try {
    const data = JSON.parse(body) as T

    return { data, ok: response.ok }
  } catch (error) {
    console.error('[useFetch] failed to parse JSON payload', {
      endpoint,
      status: response.status,
      bodySnippet: body.slice(0, 200)
    })

    throw error
  }
}
