import Dexie, { type Table } from 'dexie'
import type { Product, Sale, Purchase } from '../types'

export interface PendingSync {
  id?: number
  type: 'sale' | 'purchase' | 'product_update'
  action: 'create' | 'update' | 'delete'
  data: unknown
  created_at: string
}

export class InventoDB extends Dexie {
  products!: Table<Product>
  pending_syncs!: Table<PendingSync>

  constructor() {
    super('AdvancedInventoDB')
    this.version(1).stores({
      products: 'id, name, category, barcode, quantity, updated_at',
      pending_syncs: '++id, type, action, created_at',
    })
  }
}

export const db = new InventoDB()

// Cache products in IndexedDB for offline use
export const cacheProducts = async (products: Product[]) => {
  await db.products.bulkPut(products)
}

export const getCachedProducts = async (): Promise<Product[]> => {
  return await db.products.toArray()
}

export const addPendingSync = async (sync: Omit<PendingSync, 'id'>) => {
  await db.pending_syncs.add(sync)
}

export const getPendingSyncs = async (): Promise<PendingSync[]> => {
  return await db.pending_syncs.toArray()
}

export const clearPendingSync = async (id: number) => {
  await db.pending_syncs.delete(id)
}
