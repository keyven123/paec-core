const STORAGE_KEY = 'paec_affiliate_ref_by_event'
const MAX_REF_LEN = 32

/** eventKey (slug or uuid) → referral code */
type AffiliateRefStore = Record<string, string>

function normalizeRef(ref: string | undefined | null): string | undefined {
  const trimmed = ref?.trim()
  if (!trimmed) return undefined
  return trimmed.slice(0, MAX_REF_LEN)
}

function normalizeEventKey(
  eventKey: string | undefined | null,
): string | undefined {
  const key = eventKey?.trim()
  return key || undefined
}

function readStore(): AffiliateRefStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, unknown>
    if (!parsed || typeof parsed !== 'object') return {}

    // Support legacy `{ code, savedAt }` entries from the previous TTL format.
    const store: AffiliateRefStore = {}
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === 'string' && value.trim()) {
        store[key] = value.trim().slice(0, MAX_REF_LEN)
        continue
      }
      if (value && typeof value === 'object' && 'code' in value) {
        const code = normalizeRef((value as { code?: unknown }).code as string)
        if (code) store[key] = code
      }
    }
    return store
  } catch {
    return {}
  }
}

function writeStore(store: AffiliateRefStore): void {
  try {
    if (Object.keys(store).length === 0) {
      localStorage.removeItem(STORAGE_KEY)
      return
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  } catch {
    // ignore quota / private mode errors
  }
}

/**
 * Persist a referral code for a specific event (slug or uuid).
 * A new ref for the same event overwrites the previous one.
 * Stays until cleared after a successful purchase.
 */
export function persistAffiliateRefFromUrl(
  ref: string | undefined | null,
  eventKey: string | undefined | null,
): void {
  const code = normalizeRef(ref)
  const key = normalizeEventKey(eventKey)
  if (!code || !key || typeof window === 'undefined') return

  try {
    const store = readStore()
    store[key] = code
    writeStore(store)
  } catch {
    // ignore
  }
}

/**
 * Prefer an explicit URL `ref`. Otherwise return the stored code
 * for the given event key(s).
 */
export function peekAffiliateRefFromUrl(
  urlRef: string | undefined | null,
  ...eventKeys: Array<string | undefined | null>
): string | undefined {
  const fromUrl = normalizeRef(urlRef)
  if (fromUrl) return fromUrl

  if (typeof window === 'undefined') return undefined

  try {
    const store = readStore()
    for (const eventKey of eventKeys) {
      const key = normalizeEventKey(eventKey)
      if (!key) continue
      const code = normalizeRef(store[key])
      if (code) return code
    }
  } catch {
    // ignore
  }

  return undefined
}

/** Remove stored referral code(s) for an event after a successful purchase. */
export function clearAffiliateRef(
  ...eventKeys: Array<string | undefined | null>
): void {
  if (typeof window === 'undefined') return

  try {
    const store = readStore()
    let changed = false
    for (const eventKey of eventKeys) {
      const key = normalizeEventKey(eventKey)
      if (!key || !(key in store)) continue
      delete store[key]
      changed = true
    }
    if (changed) writeStore(store)
  } catch {
    // ignore
  }
}
