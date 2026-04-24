import assetIndex from './mc-asset-index.json'

export interface MCAsset {
  label: string
  icon: string       // inventory render path
  icon3d?: string    // isometric 3D render path (optional)
}

// The full asset list — 1500+ items, mobs, blocks, babies
export const MC_ASSETS: MCAsset[] = assetIndex as MCAsset[]

// Fast label → asset lookup
const _byLabel = new Map<string, MCAsset>(
  MC_ASSETS.map(a => [a.label.toLowerCase(), a])
)

/**
 * Find the best matching asset for a given search string.
 * Returns the first asset whose label starts with the query,
 * falling back to the first that contains it.
 */
export function findAsset(query: string): MCAsset | null {
  if (!query.trim()) return null
  const q = query.toLowerCase()
  // Exact match first
  const exact = _byLabel.get(q)
  if (exact) return exact
  // Starts-with
  const startsWith = MC_ASSETS.find(a => a.label.toLowerCase().startsWith(q))
  if (startsWith) return startsWith
  // Contains
  return MC_ASSETS.find(a => a.label.toLowerCase().includes(q)) ?? null
}

/**
 * Search assets by label, returning up to `limit` results.
 */
export function searchAssets(query: string, limit = 20): MCAsset[] {
  if (!query.trim()) return MC_ASSETS.slice(0, limit)
  const q = query.toLowerCase()
  return MC_ASSETS.filter(a => a.label.toLowerCase().includes(q)).slice(0, limit)
}
