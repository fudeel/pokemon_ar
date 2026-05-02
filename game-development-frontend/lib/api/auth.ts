// game-development-frontend/lib/api/auth.ts

import { apiClient } from './client'
import type { PlayerLoginResponse, PlayerRegistrationResponse } from '@/types'

export const authApi = {
  register: (username: string, email: string, password: string) =>
    apiClient.post<PlayerRegistrationResponse>('/auth/register', {
      username,
      email,
      password,
    }),

  login: (username: string, password: string) =>
    apiClient.post<PlayerLoginResponse>('/auth/login', { username, password }),

  logout: () => apiClient.post<void>('/auth/logout', {}),
}
