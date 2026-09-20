const refreshTokenUrl = '/api/v1/Auth/refresh-token'

type TokenResponse = {
  token?: string
  refreshToken?: string
}

type ApiErrorBody = {
  message?: string
  code?: string
}

function getCookie(name: string) {
  const cookie = document.cookie
    .split('; ')
    .find((value) => value.startsWith(`${name}=`))

  return cookie ? decodeURIComponent(cookie.substring(name.length + 1)) : ''
}

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; SameSite=Lax${window.location.protocol === 'https:' ? '; Secure' : ''}`
}

export function getAccessToken() {
  return getCookie('authToken')
}

export function getRefreshToken() {
  return getCookie('refreshToken')
}

export function saveTokens(tokens: TokenResponse) {
  if (tokens.token) {
    setCookie('authToken', tokens.token)
  }
  if (tokens.refreshToken) {
    setCookie('refreshToken', tokens.refreshToken)
  }
}

export function clearAuthTokens() {
  document.cookie = 'authToken=; Max-Age=0; Path=/'
  document.cookie = 'refreshToken=; Max-Age=0; Path=/'
}

export async function refreshAccessToken() {
  const token = getAccessToken()
  const refreshToken = getRefreshToken()

  if (!token || !refreshToken) {
    return false
  }

  const response = await fetch(refreshTokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ token, refreshToken }),
  })

  if (!response.ok) {
    return false
  }

  const tokens = await response.json() as TokenResponse
  if (!tokens.token) {
    return false
  }

  saveTokens(tokens)
  return true
}

let refreshInProgress: Promise<boolean> | null = null

async function refreshOnce() {
  if (!refreshInProgress) {
    refreshInProgress = refreshAccessToken().finally(() => {
      refreshInProgress = null
    })
  }

  return refreshInProgress
}

export async function authenticatedFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const requestWithToken = () => {
    const headers = new Headers(init.headers)
    const token = getAccessToken()

    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    }

    return fetch(input, { ...init, headers })
  }

  let response = await requestWithToken()
  if (response.ok) {
    return response
  }

  let errorBody: ApiErrorBody | null = null
  try {
    errorBody = await response.clone().json() as ApiErrorBody
  } catch {
    return response
  }

  if (errorBody?.code !== 'TOKEN_EXPIRED') {
    return response
  }

  const refreshed = await refreshOnce()
  if (!refreshed) {
    return response
  }

  response = await requestWithToken()
  return response
}