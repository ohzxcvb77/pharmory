import { useId, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import {
  ArrowRight,
  BookOpenCheck,
  BrainCircuit,
  Check,
  Eye,
  EyeOff,
  FileSearch,
  Info,
  LockKeyhole,
  ShieldCheck,
  UserRound,
} from 'lucide-react'
import {
  AuthError,
  createProfile,
  isValidPin,
  isValidProfileId,
  listProfiles,
  loginProfile,
} from '../auth'
import type { AuthProfile } from '../auth'
import { BrandMark } from '../ui'

export interface AuthScreenProps {
  onAuthenticated: (profile: AuthProfile, created: boolean) => void
}

type AuthMode = 'login' | 'create'

const authStyles = `
  .auth-screen { min-height: 100svh; display: grid; grid-template-columns: minmax(360px, .88fr) minmax(520px, 1.12fr); background: #f6f6f2; }
  .auth-story { position: relative; display: flex; min-height: 100svh; flex-direction: column; padding: clamp(30px, 5vw, 68px); color: #fff; background: #17362d; overflow: hidden; }
  .auth-story::before, .auth-story::after { position: absolute; border: 1px solid rgba(223,243,106,.12); border-radius: 50%; content: ''; }
  .auth-story::before { right: -170px; top: 13%; width: 390px; height: 390px; }
  .auth-story::after { left: -130px; bottom: -170px; width: 340px; height: 340px; }
  .auth-story .brand-mark { position: relative; z-index: 1; }
  .auth-story-copy { position: relative; z-index: 1; max-width: 510px; margin: auto 0; padding: 70px 0; }
  .auth-story-kicker { display: inline-flex; align-items: center; gap: 7px; padding: 7px 10px; border: 1px solid rgba(223,243,106,.23); border-radius: 999px; color: #dff36a; background: rgba(223,243,106,.07); font-size: 10px; font-weight: 800; letter-spacing: .12em; }
  .auth-story h1 { margin-top: 23px; color: #fff; font-size: clamp(37px, 4vw, 59px); line-height: 1.08; letter-spacing: -.055em; }
  .auth-story h1 span { color: #dff36a; }
  .auth-story-copy > p { max-width: 450px; margin-top: 18px; color: #a9beb5; font-size: 15px; line-height: 1.75; }
  .auth-benefits { display: grid; gap: 11px; margin-top: 34px; }
  .auth-benefit { display: flex; align-items: center; gap: 13px; padding: 12px 14px; border: 1px solid rgba(255,255,255,.08); border-radius: 14px; background: rgba(255,255,255,.045); }
  .auth-benefit > span { display: grid; flex: 0 0 auto; place-items: center; width: 34px; height: 34px; border-radius: 10px; color: #203a31; background: #dff36a; }
  .auth-benefit strong { display: block; color: #eef5f2; font-size: 13px; }
  .auth-benefit small { display: block; margin-top: 3px; color: #89a197; font-size: 11px; }
  .auth-story-foot { position: relative; z-index: 1; display: flex; align-items: center; gap: 8px; color: #819a8f; font-size: 10px; }
  .auth-main { display: grid; min-width: 0; place-items: center; padding: 40px clamp(28px, 6vw, 90px); }
  .auth-card { width: min(440px, 100%); }
  .auth-mobile-brand { display: none; }
  .auth-tabs { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; padding: 4px; border: 1px solid #e2e6e1; border-radius: 13px; background: #ecefea; }
  .auth-tabs button { min-height: 42px; border-radius: 9px; color: #7a857f; background: transparent; font-size: 13px; font-weight: 700; transition: 160ms ease; }
  .auth-tabs button[aria-selected='true'] { color: #26382f; background: #fff; box-shadow: 0 2px 10px rgba(24,50,40,.08); }
  .auth-heading { margin: 31px 0 25px; }
  .auth-heading h2 { color: #1f2925; font-size: clamp(28px, 3vw, 36px); line-height: 1.18; letter-spacing: -.045em; }
  .auth-heading p { margin-top: 9px; color: #77827c; font-size: 13px; line-height: 1.6; }
  .auth-recent { margin: -5px 0 22px; }
  .auth-recent-label { display: block; margin-bottom: 9px; color: #8a958f; font-size: 10px; font-weight: 800; letter-spacing: .1em; }
  .auth-profile-list { display: flex; gap: 8px; overflow-x: auto; padding: 1px 1px 5px; }
  .auth-profile-chip { display: flex; flex: 0 0 auto; align-items: center; gap: 9px; min-height: 48px; padding: 6px 12px 6px 7px; border: 1px solid #e2e7e2; border-radius: 13px; color: #4d5b54; background: #fff; text-align: left; transition: 160ms ease; }
  .auth-profile-chip:hover, .auth-profile-chip.selected { border-color: #89a99a; background: #f1f7f3; }
  .auth-profile-chip > span { display: grid; place-items: center; width: 34px; height: 34px; border-radius: 10px; color: #28503f; background: #dfeee6; font-size: 12px; font-weight: 800; }
  .auth-profile-chip strong, .auth-profile-chip small { display: block; max-width: 110px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
  .auth-profile-chip strong { font-size: 12px; }
  .auth-profile-chip small { margin-top: 2px; color: #8c9791; font-size: 9px; }
  .auth-form { display: grid; gap: 16px; }
  .auth-field { display: grid; gap: 7px; }
  .auth-field > label { color: #405048; font-size: 12px; font-weight: 700; }
  .auth-field-wrap { position: relative; }
  .auth-field-wrap > svg { position: absolute; left: 14px; top: 50%; color: #829089; transform: translateY(-50%); pointer-events: none; }
  .auth-field input { width: 100%; height: 49px; padding: 0 44px; border: 1px solid #dde3de; border-radius: 12px; color: #223029; outline: none; background: #fff; font-size: 13px; transition: 150ms ease; }
  .auth-field input::placeholder { color: #abb3af; }
  .auth-field input:focus { border-color: #6f9a86; box-shadow: 0 0 0 3px rgba(57,116,95,.11); }
  .auth-field-hint { color: #929c97; font-size: 10px; line-height: 1.4; }
  .auth-field-hint.error { color: #b25645; }
  .auth-pin-toggle { position: absolute; right: 7px; top: 50%; display: grid; place-items: center; width: 36px; height: 36px; padding: 0; border-radius: 9px; color: #7d8a84; background: transparent; transform: translateY(-50%); }
  .auth-pin-toggle:hover { color: #315846; background: #eff4f1; }
  .auth-remember { display: flex; align-items: center; gap: 9px; width: fit-content; color: #58655f; font-size: 11px; cursor: pointer; }
  .auth-remember input { position: absolute; width: 1px; height: 1px; opacity: 0; }
  .auth-checkbox { display: grid; place-items: center; width: 19px; height: 19px; border: 1px solid #ced6d0; border-radius: 6px; color: transparent; background: #fff; transition: 140ms ease; }
  .auth-remember input:checked + .auth-checkbox { color: #173c31; border-color: #dff36a; background: #dff36a; }
  .auth-remember input:focus-visible + .auth-checkbox { outline: 3px solid rgba(57,116,95,.2); outline-offset: 2px; }
  .auth-error { display: flex; align-items: flex-start; gap: 8px; padding: 11px 12px; border: 1px solid #f1c8bd; border-radius: 11px; color: #a64f3e; background: #fff1ed; font-size: 11px; line-height: 1.45; }
  .auth-error svg { flex: 0 0 auto; margin-top: 1px; }
  .auth-pin-help { margin: -8px 2px 0; color: #7f6e67; font-size: 10px; line-height: 1.5; }
  .auth-submit { display: flex; align-items: center; justify-content: center; gap: 9px; width: 100%; min-height: 50px; margin-top: 1px; border-radius: 12px; color: #17362d; background: #dff36a; box-shadow: 0 9px 24px rgba(95,112,26,.15); font-size: 13px; font-weight: 800; transition: 160ms ease; }
  .auth-submit:hover:not(:disabled) { background: #e6f67f; transform: translateY(-1px); }
  .auth-submit:disabled { opacity: .55; }
  .auth-submit .auth-spinner { width: 17px; height: 17px; border: 2px solid rgba(23,54,45,.25); border-top-color: #17362d; border-radius: 50%; animation: auth-spin 700ms linear infinite; }
  @keyframes auth-spin { to { transform: rotate(360deg); } }
  .auth-switch { margin-top: 17px; color: #7f8a84; font-size: 11px; text-align: center; }
  .auth-switch button { padding: 3px; color: #39745f; background: transparent; font-weight: 800; }
  .auth-privacy { display: flex; align-items: flex-start; gap: 10px; padding: 13px; margin-top: 24px; border: 1px solid #e0e5e1; border-radius: 13px; color: #69766f; background: #f0f2ee; font-size: 10px; line-height: 1.55; }
  .auth-privacy > svg { flex: 0 0 auto; margin-top: 1px; color: #54806c; }
  .auth-privacy strong { display: block; margin-bottom: 2px; color: #45554d; font-size: 11px; }
  .auth-privacy details { margin-top: 5px; }
  .auth-privacy summary { width: fit-content; color: #39745f; cursor: pointer; font-weight: 700; }
  .auth-privacy details p { margin-top: 5px; }
  @media (max-width: 860px) {
    .auth-screen { grid-template-columns: 1fr; background: #17362d; }
    .auth-story { min-height: auto; padding: 24px 24px 34px; }
    .auth-story-copy { margin: 28px 0 0; padding: 0; }
    .auth-story h1 { margin-top: 17px; font-size: clamp(31px, 9vw, 43px); }
    .auth-story-copy > p { margin-top: 12px; font-size: 13px; }
    .auth-benefits, .auth-story-foot { display: none; }
    .auth-main { place-items: start center; padding: 0; background: #17362d; }
    .auth-card { width: 100%; padding: 28px 22px max(30px, env(safe-area-inset-bottom)); border-radius: 26px 26px 0 0; background: #f6f6f2; }
    .auth-heading { margin: 26px 0 22px; }
    .auth-field input { font-size: 16px; }
  }
  @media (max-width: 520px) {
    .auth-story { padding: 18px 18px 22px; }
    .auth-story-copy { margin-top: 17px; }
    .auth-story-kicker, .auth-story-copy > p { display: none; }
    .auth-story h1 { margin-top: 0; font-size: clamp(28px, 9vw, 36px); }
    .auth-card { padding-top: 22px; }
    .auth-heading { margin: 21px 0 18px; }
    .auth-form { gap: 14px; }
  }
  @media (max-width: 390px) {
    .auth-story { padding-inline: 18px; }
    .auth-card { padding-inline: 17px; }
    .auth-field input { font-size: 16px; }
  }
  @media (prefers-reduced-motion: reduce) {
    .auth-submit, .auth-tabs button, .auth-profile-chip, .auth-field input { transition: none; }
    .auth-submit .auth-spinner { animation-duration: 1.4s; }
  }
`

function errorMessage(error: unknown) {
  if (error instanceof AuthError) return error.message
  return '요청을 처리하지 못했어요. 잠시 후 다시 시도해 주세요.'
}

export function AuthScreen({ onAuthenticated }: AuthScreenProps) {
  const profiles = useMemo(() => listProfiles().slice(0, 4), [])
  const [mode, setMode] = useState<AuthMode>(profiles.length ? 'login' : 'create')
  const [displayName, setDisplayName] = useState('')
  const [profileId, setProfileId] = useState(profiles[0]?.loginId ?? '')
  const [pin, setPin] = useState('')
  const [pinConfirmation, setPinConfirmation] = useState('')
  const [showPin, setShowPin] = useState(false)
  const [remember, setRemember] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const pinRef = useRef<HTMLInputElement>(null)
  const nameId = useId()
  const profileIdId = useId()
  const pinId = useId()
  const pinConfirmationId = useId()

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode)
    setError('')
    setPin('')
    setPinConfirmation('')
    setShowPin(false)
  }

  const chooseProfile = (profile: AuthProfile) => {
    setProfileId(profile.loginId)
    setError('')
    window.setTimeout(() => pinRef.current?.focus(), 0)
  }

  const loginReady = isValidProfileId(profileId) && isValidPin(pin)
  const createReady =
    displayName.trim().length > 0 &&
    displayName.trim().length <= 20 &&
    isValidProfileId(profileId) &&
    isValidPin(pin) &&
    pin === pinConfirmation

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submitting) return
    setError('')
    setSubmitting(true)
    try {
      if (mode === 'login') {
        const profile = await loginProfile({ id: profileId, pin, remember })
        onAuthenticated(profile, false)
      } else {
        const profile = await createProfile({
          displayName,
          id: profileId,
          pin,
          pinConfirmation,
          remember,
        })
        onAuthenticated(profile, true)
      }
    } catch (caughtError) {
      setError(errorMessage(caughtError))
      setSubmitting(false)
    }
  }

  return (
    <main className="auth-screen">
      <style>{authStyles}</style>
      <section className="auth-story" aria-label="Pharmory 소개">
        <BrandMark />
        <div className="auth-story-copy">
          <span className="auth-story-kicker"><ShieldCheck size={14} /> PERSONAL STUDY SPACE</span>
          <h1>근거를 찾고,<br /><span>기억으로 남기세요.</span></h1>
          <p>영문 의약학 근거를 능동 회상과 간격 반복으로 연결하는 나만의 약학 학습 공간입니다.</p>
          <div className="auth-benefits">
            <div className="auth-benefit"><span><BookOpenCheck size={17} /></span><div><strong>개념에서 기억까지</strong><small>핵심 연결을 짧고 선명하게 정리합니다.</small></div></div>
            <div className="auth-benefit"><span><BrainCircuit size={17} /></span><div><strong>회상 중심 학습</strong><small>플래시카드와 퀴즈가 취약 기억을 찾습니다.</small></div></div>
            <div className="auth-benefit"><span><FileSearch size={17} /></span><div><strong>근거가 보이는 카드</strong><small>영문 논문과 출처를 학습 맥락에 연결합니다.</small></div></div>
          </div>
        </div>
        <p className="auth-story-foot"><LockKeyhole size={13} /> 프로필과 학습 기록은 이 브라우저에 저장됩니다.</p>
      </section>

      <section className="auth-main" aria-label="프로필 인증">
        <div className="auth-card">
          <div className="auth-tabs" role="tablist" aria-label="인증 방식">
            <button type="button" role="tab" aria-selected={mode === 'login'} onClick={() => switchMode('login')}>로그인</button>
            <button type="button" role="tab" aria-selected={mode === 'create'} onClick={() => switchMode('create')}>새 프로필 만들기</button>
          </div>

          <header className="auth-heading">
            <h2>{mode === 'login' ? '다시 만나서 반가워요' : '나만의 학습 프로필 만들기'}</h2>
            <p>{mode === 'login' ? '내 프로필의 학습 기록을 이어갑니다.' : '약 30초면 시작할 수 있어요.'}</p>
          </header>

          {mode === 'login' && profiles.length > 0 && (
            <div className="auth-recent">
              <span className="auth-recent-label">최근 프로필</span>
              <div className="auth-profile-list">
                {profiles.map((profile) => (
                  <button
                    key={profile.id}
                    type="button"
                    className={`auth-profile-chip ${profileId === profile.id ? 'selected' : ''}`}
                    aria-pressed={profileId === profile.id}
                    onClick={() => chooseProfile(profile)}
                  >
                    <span>{profile.displayName.slice(0, 1)}</span>
                    <div><strong>{profile.displayName}</strong><small>@{profile.loginId}</small></div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            {mode === 'create' && (
              <div className="auth-field">
                <label htmlFor={nameId}>이름</label>
                <div className="auth-field-wrap">
                  <UserRound size={17} />
                  <input
                    id={nameId}
                    value={displayName}
                    maxLength={20}
                    autoComplete="name"
                    placeholder="학습 화면에 표시할 이름"
                    onChange={(event) => { setDisplayName(event.target.value); setError('') }}
                  />
                </div>
              </div>
            )}

            <div className="auth-field">
              <label htmlFor={profileIdId}>학습 ID</label>
              <div className="auth-field-wrap">
                <UserRound size={17} />
                <input
                  id={profileIdId}
                  value={profileId}
                  maxLength={20}
                  autoCapitalize="none"
                  autoCorrect="off"
                  autoComplete="username"
                  spellCheck={false}
                  placeholder="예: pharma_student"
                  onChange={(event) => { setProfileId(event.target.value.toLowerCase()); setError('') }}
                />
              </div>
              {mode === 'create' && <small className="auth-field-hint">영문 소문자, 숫자, 밑줄(_) 3~20자</small>}
            </div>

            <div className="auth-field">
              <label htmlFor={pinId}>PIN 4자리</label>
              <div className="auth-field-wrap">
                <LockKeyhole size={17} />
                <input
                  ref={pinRef}
                  id={pinId}
                  type={showPin ? 'text' : 'password'}
                  value={pin}
                  inputMode="numeric"
                  maxLength={4}
                  pattern="[0-9]{4}"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  placeholder="숫자 4자리"
                  onChange={(event) => { setPin(event.target.value.replace(/\D/g, '').slice(0, 4)); setError('') }}
                />
                <button className="auth-pin-toggle" type="button" onClick={() => setShowPin((value) => !value)} aria-label={showPin ? 'PIN 숨기기' : 'PIN 보기'}>
                  {showPin ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {mode === 'create' && (
              <div className="auth-field">
                <label htmlFor={pinConfirmationId}>PIN 다시 입력</label>
                <div className="auth-field-wrap">
                  <LockKeyhole size={17} />
                  <input
                    id={pinConfirmationId}
                    type={showPin ? 'text' : 'password'}
                    value={pinConfirmation}
                    inputMode="numeric"
                    maxLength={4}
                    pattern="[0-9]{4}"
                    autoComplete="new-password"
                    placeholder="같은 PIN을 한 번 더 입력"
                    onChange={(event) => { setPinConfirmation(event.target.value.replace(/\D/g, '').slice(0, 4)); setError('') }}
                  />
                </div>
                {pinConfirmation.length === 4 && pin !== pinConfirmation && <small className="auth-field-hint error">PIN이 서로 같지 않아요.</small>}
              </div>
            )}

            <label className="auth-remember">
              <input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} />
              <span className="auth-checkbox"><Check size={13} strokeWidth={3} /></span>
              이 기기에서 로그인 유지
            </label>

            {error && <div className="auth-error" role="alert" aria-live="polite"><Info size={15} /> <span>{error}</span></div>}
            {error.includes('PIN이 맞지') && <p className="auth-pin-help">PIN은 서버에서 복구할 수 없어요. 기억나지 않으면 새 프로필을 만들어 주세요.</p>}

            <button className="auth-submit" type="submit" disabled={submitting || (mode === 'login' ? !loginReady : !createReady)}>
              {submitting ? <><span className="auth-spinner" /> 확인하고 있어요</> : <>{mode === 'login' ? '내 학습으로 들어가기' : '프로필 만들고 시작하기'} <ArrowRight size={17} /></>}
            </button>
          </form>

          <p className="auth-switch">
            {mode === 'login' ? '처음이신가요?' : '이미 프로필이 있나요?'}{' '}
            <button type="button" onClick={() => switchMode(mode === 'login' ? 'create' : 'login')}>
              {mode === 'login' ? '새 프로필 만들기' : '로그인'}
            </button>
          </p>

          <aside className="auth-privacy">
            <ShieldCheck size={17} />
            <div>
              <strong>이 브라우저에만 저장해요</strong>
              로그인 정보와 학습 기록은 이 브라우저에만 저장되며 서버로 전송되지 않습니다.
              <details>
                <summary>PIN과 기기 간 동기화 안내</summary>
                <p>PIN은 이 브라우저에서 프로필을 구분하는 로컬 잠금이며 학습 데이터 자체를 암호화하지 않습니다. 다른 휴대폰이나 브라우저와 자동으로 동기화되지 않으며, 학습 기록 내보내기로 현재 기록을 백업할 수 있어요.</p>
              </details>
            </div>
          </aside>
        </div>
      </section>
    </main>
  )
}
