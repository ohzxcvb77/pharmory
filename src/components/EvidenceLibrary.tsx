import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import {
  ArrowRight,
  Bookmark,
  BookOpen,
  Check,
  ChevronDown,
  ExternalLink,
  FileSearch,
  Filter,
  GraduationCap,
  Info,
  Layers3,
  LoaderCircle,
  Search,
  Sparkles,
  WandSparkles,
} from 'lucide-react'
import { paperUrl, searchLiterature } from '../literature'
import type { LiteraturePaper } from '../types'

const quickQueries = [
  'SGLT2 cardiovascular outcomes',
  'vancomycin AUC monitoring',
  'GLP-1 receptor agonist obesity',
  'CYP3A4 drug interactions review',
]

export function EvidenceLibrary({
  savedPapers,
  generatedPaperIds,
  onToggleSave,
  onGenerateCard,
}: {
  savedPapers: LiteraturePaper[]
  generatedPaperIds: string[]
  onToggleSave: (paper: LiteraturePaper) => void
  onGenerateCard: (paper: LiteraturePaper) => void
}) {
  const [query, setQuery] = useState('SGLT2 cardiovascular outcomes')
  const [searchedQuery, setSearchedQuery] = useState('SGLT2 cardiovascular outcomes')
  const [results, setResults] = useState<LiteraturePaper[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [openAccessOnly, setOpenAccessOnly] = useState(false)
  const [sort, setSort] = useState<'relevance' | 'citations' | 'newest'>('relevance')
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    searchLiterature('SGLT2 cardiovascular outcomes')
      .then((papers) => { if (active) setResults(papers) })
      .catch(() => { if (active) setError('지금은 실시간 문헌 검색에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const visibleResults = useMemo(() => {
    const filtered = openAccessOnly ? results.filter((paper) => paper.isOpenAccess) : results
    if (sort === 'citations') return [...filtered].sort((a, b) => b.citedByCount - a.citedByCount)
    if (sort === 'newest') return [...filtered].sort((a, b) => Number(b.year) - Number(a.year))
    return filtered
  }, [openAccessOnly, results, sort])

  const runSearch = async (searchTerm: string) => {
    const normalized = searchTerm.trim()
    if (!normalized) return
    setLoading(true)
    setError('')
    setSearchedQuery(normalized)
    setExpanded(null)
    try {
      setResults(await searchLiterature(normalized))
    } catch {
      setError('검색 연결이 원활하지 않습니다. 네트워크를 확인한 뒤 다시 시도해 주세요.')
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    void runSearch(query)
  }

  return (
    <div className="page evidence-page">
      <section className="evidence-search-hero">
        <div className="evidence-search-copy">
          <span className="eyebrow-chip light"><GraduationCap size={14} /> ENGLISH BIOMEDICAL LITERATURE</span>
          <h1>논문을 찾고,<br /><span>기억할 지식</span>으로 바꾸세요.</h1>
          <p>Europe PMC가 색인한 영문 생의학 문헌을 실시간으로 검색합니다. 초록을 읽고 출처가 연결된 플래시카드로 저장하세요.</p>
        </div>
        <div className="evidence-orbit" aria-hidden="true">
          <div className="orbit orbit-a"><span>PMID</span><i /></div>
          <div className="orbit orbit-b"><span>DOI</span><i /></div>
          <div className="orbit-center"><FileSearch size={30} /><small>LIVE<br />EVIDENCE</small></div>
        </div>
        <form className="paper-search" onSubmit={submit}>
          <Search size={21} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="영문 키워드, 약물명, 질환명 또는 연구 질문" aria-label="문헌 검색어" />
          <button type="submit">논문 검색 <ArrowRight size={17} /></button>
        </form>
        <div className="quick-query-row"><span>빠른 검색</span>{quickQueries.map((item) => <button key={item} onClick={() => { setQuery(item); void runSearch(item) }}>{item}</button>)}</div>
      </section>

      <div className="coverage-note">
        <Info size={17} />
        <p><strong>검색 범위</strong> 이번 프로토타입은 Europe PMC의 영문 생의학 색인을 사용합니다. 유료 원문은 복제하지 않으며, 공개된 초록과 원문 링크만 학습에 활용합니다.</p>
        <a href="https://europepmc.org/RestfulWebService" target="_blank" rel="noreferrer">데이터 출처 <ExternalLink size={13} /></a>
      </div>

      <div className="evidence-layout">
        <main className="evidence-results">
          <div className="evidence-toolbar">
            <div><span className="section-kicker">SEARCH RESULTS</span><h2>“{searchedQuery}”</h2><p>{loading ? '학술 인덱스를 검색하는 중' : `${visibleResults.length}개의 관련 문헌`}</p></div>
            <div className="result-filters">
              <button className={openAccessOnly ? 'active' : ''} onClick={() => setOpenAccessOnly((value) => !value)}><Filter size={15} /> Open access {openAccessOnly && <Check size={13} />}</button>
              <label>정렬<select value={sort} onChange={(event) => setSort(event.target.value as typeof sort)}><option value="relevance">관련도순</option><option value="citations">인용순</option><option value="newest">최신순</option></select><ChevronDown size={14} /></label>
            </div>
          </div>

          {loading && <div className="loading-state"><LoaderCircle size={28} /><h3>영문 근거를 찾고 있어요.</h3><p>Europe PMC에서 초록과 서지정보를 불러옵니다.</p></div>}
          {!loading && error && <div className="error-state"><Info size={26} /><h3>검색 결과를 불러오지 못했어요.</h3><p>{error}</p><button className="soft-button" onClick={() => void runSearch(searchedQuery)}>다시 검색</button></div>}
          {!loading && !error && visibleResults.length === 0 && <div className="empty-state panel"><FileSearch size={30} /><h3>조건에 맞는 결과가 없습니다.</h3><p>검색어를 넓히거나 Open access 필터를 해제해 보세요.</p></div>}

          <div className="paper-list">
            {!loading && !error && visibleResults.map((paper, index) => {
              const isSaved = savedPapers.some((item) => item.id === paper.id)
              const isGenerated = generatedPaperIds.includes(paper.id)
              const isExpanded = expanded === paper.id
              return (
                <article className="paper-card" key={`${paper.source}-${paper.id}`}>
                  <div className="paper-rank">{String(index + 1).padStart(2, '0')}</div>
                  <div className="paper-body">
                    <div className="paper-badges"><span>ENGLISH</span>{paper.isOpenAccess && <span className="oa">OPEN ACCESS</span>}{paper.pmid && <span>PMID {paper.pmid}</span>}</div>
                    <h3>{paper.title}</h3>
                    <p className="paper-authors">{paper.authors}</p>
                    <div className="paper-citation"><strong>{paper.journal}</strong><span>·</span><span>{paper.year}</span><span>·</span><span>인용 {paper.citedByCount.toLocaleString()}</span></div>
                    {paper.abstract && isExpanded && <div className="paper-abstract"><strong>ABSTRACT</strong><p>{paper.abstract}</p></div>}
                    <div className="paper-actions">
                      {paper.abstract ? <button className="abstract-toggle" onClick={() => setExpanded(isExpanded ? null : paper.id)}><BookOpen size={15} /> {isExpanded ? '초록 접기' : '초록 읽기'}</button> : <span className="no-abstract">초록 미제공</span>}
                      <a href={paperUrl(paper)} target="_blank" rel="noreferrer">원문 정보 <ExternalLink size={14} /></a>
                      <button className={isSaved ? 'saved' : ''} onClick={() => onToggleSave(paper)}><Bookmark size={15} fill={isSaved ? 'currentColor' : 'none'} /> {isSaved ? '저장됨' : '저장'}</button>
                      <button className={isGenerated ? 'generated' : 'generate-card'} disabled={!paper.abstract || isGenerated} onClick={() => onGenerateCard(paper)}>
                        {isGenerated ? <Check size={15} /> : <WandSparkles size={15} />}{isGenerated ? '카드 생성됨' : '학습 카드 만들기'}
                      </button>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        </main>

        <aside className="evidence-sidebar">
          <section className="panel saved-library">
            <div className="side-panel-title"><span><Bookmark size={18} /></span><div><strong>저장한 논문</strong><small>MY EVIDENCE LIBRARY</small></div><em>{savedPapers.length}</em></div>
            {savedPapers.length ? (
              <div className="saved-paper-list">{savedPapers.slice(0, 4).map((paper) => <a key={paper.id} href={paperUrl(paper)} target="_blank" rel="noreferrer"><span>{paper.year}</span><strong>{paper.title}</strong><ExternalLink size={13} /></a>)}</div>
            ) : (
              <div className="saved-empty"><Bookmark size={22} /><p>논문을 저장하면 여기에 모입니다.</p></div>
            )}
          </section>
          <section className="panel evidence-workflow">
            <div className="side-panel-title"><span><Sparkles size={18} /></span><div><strong>Evidence → Memory</strong><small>3-STEP WORKFLOW</small></div></div>
            <ol>
              <li><span>1</span><div><strong>Find</strong><p>영문 초록과 서지정보 확인</p></div></li>
              <li><span>2</span><div><strong>Distill</strong><p>한 카드에 하나의 핵심 주장</p></div></li>
              <li><span>3</span><div><strong>Recall</strong><p>출처를 유지한 간격 반복</p></div></li>
            </ol>
          </section>
          <section className="quality-note"><Layers3 size={17} /><p><strong>근거 품질 원칙</strong>검색 순위가 근거 수준을 뜻하지 않습니다. 연구 설계·대상·효과크기를 원문에서 함께 확인하세요.</p></section>
        </aside>
      </div>
    </div>
  )
}
