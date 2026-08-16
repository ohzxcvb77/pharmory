export const PROFILE_STORAGE_KEY = 'pharmory-profiles-v1'
export const ACTIVE_PROFILE_STORAGE_KEY = 'pharmory-active-profile-v1'
export const AUTH_CHANNEL_NAME = 'pharmory-auth-v1'

const PBKDF2_ITERATIONS = 210_000
const REMEMBERED_SESSION_MS = 30 * 24 * 60 * 60 * 1000
const TAB_SESSION_MS = 12 * 60 * 60 * 1000

export interface AuthProfile {
  id: string
  loginId: string
  displayName: string
  createdAt: string
  lastActiveAt: string
}

interface StoredProfile extends AuthProfile {
  credential: {
    algorithm: 'PBKDF2-SHA-256'
    iterations: number
    hash: string
    salt: string
  }
}

interface StoredSession {
  profileId: string
  expiresAt: string
}

export interface CreateProfileInput {
  displayName: string
  id: string
  pin: string
  pinConfirmation: string
  remember: boolean
}

export interface LoginProfileInput {
  id: string
  pin: string
  remember: boolean
}

export type AuthErrorCode =
  | 'invalid-name'
  | 'invalid-id'
  | 'invalid-pin'
  | 'pin-mismatch'
  | 'duplicate-id'
  | 'profile-not-found'
  | 'incorrect-pin'
  | 'storage-unavailable'
  | 'profile-data-damaged'
  | 'crypto-unavailable'

const errorMessages: Record<AuthErrorCode, string> = {
  'invalid-name': '이름은 1~20자로 입력해 주세요.',
  'invalid-id': '학습 ID는 영문 소문자, 숫자, 밑줄(_)을 사용해 3~20자로 입력해 주세요.',
  'invalid-pin': 'PIN은 숫자 4자리로 입력해 주세요.',
  'pin-mismatch': 'PIN이 서로 같지 않아요. 다시 확인해 주세요.',
  'duplicate-id': '이미 이 기기에서 사용 중인 ID예요.',
  'profile-not-found': '이 기기에 저장된 프로필을 찾지 못했어요.',
  'incorrect-pin': 'PIN이 맞지 않아요. 다시 확인해 주세요.',
  'storage-unavailable': '이 브라우저에서 프로필을 저장할 수 없어요. 저장소 사용 설정을 확인해 주세요.',
  'profile-data-damaged': '저장된 프로필 정보를 읽을 수 없어요. 브라우저 저장 공간을 확인해 주세요.',
  'crypto-unavailable': '이 브라우저에서는 PIN 해시 저장 기능을 사용할 수 없어요.',
}

export class AuthError extends Error {
  readonly code: AuthErrorCode

  constructor(code: AuthErrorCode) {
    super(errorMessages[code])
    this.name = 'AuthError'
    this.code = code
  }
}

export function normalizeProfileId(value: string) {
  return value.trim().toLowerCase()
}

export function isValidProfileId(value: string) {
  return /^[a-z0-9_]{3,20}$/.test(normalizeProfileId(value))
}

export function isValidPin(value: string) {
  return /^\d{4}$/.test(value)
}

function isStoredProfile(value: unknown): value is StoredProfile {
  if (!value || typeof value !== 'object') return false
  const profile = value as Partial<StoredProfile>
  const credential = profile.credential
  return (
    typeof profile.id === 'string' &&
    typeof profile.loginId === 'string' &&
    typeof profile.displayName === 'string' &&
    typeof profile.createdAt === 'string' &&
    typeof profile.lastActiveAt === 'string' &&
    Boolean(credential) &&
    credential?.algorithm === 'PBKDF2-SHA-256' &&
    typeof credential.iterations === 'number' &&
    credential.iterations > 0 &&
    typeof credential.hash === 'string' &&
    typeof credential.salt === 'string'
  )
}

function publicProfile(profile: StoredProfile): AuthProfile {
  const { id, loginId, displayName, createdAt, lastActiveAt } = profile
  return { id, loginId, displayName, createdAt, lastActiveAt }
}

function getLocalStorage() {
  if (typeof window === 'undefined') throw new AuthError('storage-unavailable')
  return window.localStorage
}

function readStoredProfiles(strict = false): StoredProfile[] {
  try {
    const raw = getLocalStorage().getItem(PROFILE_STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) throw new AuthError('profile-data-damaged')
    const profiles = parsed.filter(isStoredProfile)
    if (strict && profiles.length !== parsed.length) throw new AuthError('profile-data-damaged')
    return profiles
  } catch (error) {
    if (strict) {
      if (error instanceof AuthError) throw error
      throw new AuthError('profile-data-damaged')
    }
    return []
  }
}

function writeStoredProfiles(profiles: StoredProfile[]) {
  try {
    getLocalStorage().setItem(PROFILE_STORAGE_KEY, JSON.stringify(profiles))
  } catch {
    throw new AuthError('storage-unavailable')
  }
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return window.btoa(binary)
}

function base64ToBytes(value: string) {
  const binary = window.atob(value)
  return Uint8Array.from(binary, (character) => character.charCodeAt(0))
}

function createSalt() {
  if (typeof window === 'undefined' || !window.crypto?.getRandomValues) {
    throw new AuthError('crypto-unavailable')
  }
  return bytesToBase64(window.crypto.getRandomValues(new Uint8Array(16)))
}

function createProfileUuid() {
  if (typeof window === 'undefined' || !window.crypto?.getRandomValues) {
    throw new AuthError('crypto-unavailable')
  }
  if (window.crypto.randomUUID) return window.crypto.randomUUID()
  const bytes = window.crypto.getRandomValues(new Uint8Array(16))
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

async function derivePinHash(profileId: string, pin: string, salt: string, iterations: number) {
  if (typeof window === 'undefined' || !window.crypto?.subtle) {
    throw new AuthError('crypto-unavailable')
  }
  const key = await window.crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(`${profileId}:${pin}`),
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  const bits = await window.crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: base64ToBytes(salt), iterations },
    key,
    256,
  )
  return bytesToBase64(new Uint8Array(bits))
}

function hashesMatch(first: string, second: string) {
  if (first.length !== second.length) return false
  let difference = 0
  for (let index = 0; index < first.length; index += 1) {
    difference |= first.charCodeAt(index) ^ second.charCodeAt(index)
  }
  return difference === 0
}

function setActiveProfile(profileId: string, remember: boolean) {
  if (typeof window === 'undefined') throw new AuthError('storage-unavailable')
  const session: StoredSession = {
    profileId,
    expiresAt: new Date(Date.now() + (remember ? REMEMBERED_SESSION_MS : TAB_SESSION_MS)).toISOString(),
  }
  try {
    if (remember) {
      window.localStorage.setItem(ACTIVE_PROFILE_STORAGE_KEY, JSON.stringify(session))
      window.sessionStorage.removeItem(ACTIVE_PROFILE_STORAGE_KEY)
    } else {
      window.sessionStorage.setItem(ACTIVE_PROFILE_STORAGE_KEY, JSON.stringify(session))
      window.localStorage.removeItem(ACTIVE_PROFILE_STORAGE_KEY)
    }
  } catch {
    throw new AuthError('storage-unavailable')
  }
}

function readActiveSession(storage: Storage): StoredSession | null {
  const raw = storage.getItem(ACTIVE_PROFILE_STORAGE_KEY)
  if (!raw) return null
  try {
    const session = JSON.parse(raw) as Partial<StoredSession>
    if (typeof session.profileId !== 'string' || typeof session.expiresAt !== 'string') throw new Error('invalid session')
    if (new Date(session.expiresAt).getTime() <= Date.now()) {
      storage.removeItem(ACTIVE_PROFILE_STORAGE_KEY)
      return null
    }
    return session as StoredSession
  } catch {
    storage.removeItem(ACTIVE_PROFILE_STORAGE_KEY)
    return null
  }
}

function broadcastLogout() {
  if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return
  const channel = new BroadcastChannel(AUTH_CHANNEL_NAME)
  channel.postMessage({ type: 'logout' })
  channel.close()
}

export function subscribeToAuthLogout(listener: () => void) {
  if (typeof window === 'undefined') return () => undefined
  const onStorage = (event: StorageEvent) => {
    if (event.key === ACTIVE_PROFILE_STORAGE_KEY && !getActiveProfile()) listener()
  }
  window.addEventListener('storage', onStorage)
  const channel = 'BroadcastChannel' in window ? new BroadcastChannel(AUTH_CHANNEL_NAME) : null
  if (channel) channel.onmessage = (event) => { if (event.data?.type === 'logout') listener() }
  return () => {
    window.removeEventListener('storage', onStorage)
    channel?.close()
  }
}

export function listProfiles(): AuthProfile[] {
  return readStoredProfiles()
    .sort((first, second) => second.lastActiveAt.localeCompare(first.lastActiveAt))
    .map(publicProfile)
}

export function getActiveProfile(): AuthProfile | null {
  if (typeof window === 'undefined') return null
  try {
    const activeSession = readActiveSession(window.sessionStorage) ?? readActiveSession(window.localStorage)
    if (!activeSession) return null
    const profile = readStoredProfiles().find((item) => item.id === activeSession.profileId)
    if (!profile) {
      clearActiveProfile(false)
      return null
    }
    return publicProfile(profile)
  } catch {
    return null
  }
}

export function clearActiveProfile(notify = true) {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.removeItem(ACTIVE_PROFILE_STORAGE_KEY)
    window.localStorage.removeItem(ACTIVE_PROFILE_STORAGE_KEY)
  } catch {
    // A blocked storage API already behaves like a signed-out session.
  }
  if (notify) broadcastLogout()
}

export async function createProfile(input: CreateProfileInput): Promise<AuthProfile> {
  const displayName = input.displayName.trim()
  const loginId = normalizeProfileId(input.id)
  if (!displayName || displayName.length > 20) throw new AuthError('invalid-name')
  if (!isValidProfileId(loginId)) throw new AuthError('invalid-id')
  if (!isValidPin(input.pin)) throw new AuthError('invalid-pin')
  if (input.pin !== input.pinConfirmation) throw new AuthError('pin-mismatch')

  const profiles = readStoredProfiles(true)
  if (profiles.some((profile) => profile.loginId === loginId)) throw new AuthError('duplicate-id')

  const profileId = createProfileUuid()
  const salt = createSalt()
  const hash = await derivePinHash(profileId, input.pin, salt, PBKDF2_ITERATIONS)
  const now = new Date().toISOString()
  const profile: StoredProfile = {
    id: profileId,
    loginId,
    displayName,
    createdAt: now,
    lastActiveAt: now,
    credential: {
      algorithm: 'PBKDF2-SHA-256',
      iterations: PBKDF2_ITERATIONS,
      hash,
      salt,
    },
  }

  writeStoredProfiles([...profiles, profile])
  setActiveProfile(profileId, input.remember)
  return publicProfile(profile)
}

export async function loginProfile(input: LoginProfileInput): Promise<AuthProfile> {
  const loginId = normalizeProfileId(input.id)
  if (!isValidProfileId(loginId)) throw new AuthError('invalid-id')
  if (!isValidPin(input.pin)) throw new AuthError('invalid-pin')

  const profiles = readStoredProfiles(true)
  const profileIndex = profiles.findIndex((profile) => profile.loginId === loginId)
  if (profileIndex < 0) throw new AuthError('profile-not-found')

  const storedProfile = profiles[profileIndex]
  const candidateHash = await derivePinHash(
    storedProfile.id,
    input.pin,
    storedProfile.credential.salt,
    storedProfile.credential.iterations,
  )
  if (!hashesMatch(candidateHash, storedProfile.credential.hash)) throw new AuthError('incorrect-pin')

  const profile = { ...storedProfile, lastActiveAt: new Date().toISOString() }
  profiles[profileIndex] = profile
  writeStoredProfiles(profiles)
  setActiveProfile(profile.id, input.remember)
  return publicProfile(profile)
}
