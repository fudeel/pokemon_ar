// game-development-frontend/lib/api/merchant.ts

import { apiClient } from './client'
import type {
  GeoLocation,
  Merchant,
  PurchaseLineRequest,
  PurchaseReceipt,
} from '@/types'

export const merchantApi = {
  getShop: (npcId: number) =>
    apiClient.get<Merchant>(`/me/npcs/${npcId}/shop`),

  purchase: (
    npcId: number,
    location: GeoLocation,
    lines: PurchaseLineRequest[],
  ) =>
    apiClient.post<PurchaseReceipt>(`/me/npcs/${npcId}/purchase`, {
      location,
      lines,
    }),
}
