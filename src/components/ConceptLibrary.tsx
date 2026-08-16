import { useMemo, useState } from 'react'
import {
  ArrowRight,
  BookOpenCheck,
  Check,
  ChevronRight,
  CircleDot,
  FileText,
  Layers3,
  Search,
  Sparkles,
} from 'lucide-react'
import { conceptLinks, topics } from '../data'
import type { Flashcard, TopicId } from '../types'
import { SourceLink, TopicIcon } from '../ui'

export function ConceptLibrary({
  cards,
  topicMastery,
  activeTopicId,
  onSelectTopic,
  onStudy,
}: {
  cards: Flashcard[]
  topicMastery: Record<TopicId, number | null>
  activeTopicId: TopicId
  onSelectTopic: (topicId: TopicId) => void
  onStudy: (topicId: TopicId) => void
}) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'unstarted' | 'weak' | 'strong'>('all')
  const activeTopic = topics.find((topic) => topic.id === activeTopicId) ?? topics[0]
  const filteredTopics = useMemo(() => {
    const normalized = query.toLowerCase().trim()
    return topics.filter((topic) => {
      const mastery = topicMastery[topic.id]
      const matchesQuery = !normalized || [topic.name, topic.englishName, ...topic.concepts]
        .join(' ').toLowerCase().includes(normalized)
      const matchesFilter = filter === 'all' || (filter === 'unstarted' ? mastery === null : mastery !== null && (filter === 'weak' ? mastery < 60 : mastery >= 70))
      return matchesQuery && matchesFilter
    })
  }, [filter, query, topicMastery])
  const activeCards = cards.filter((card) => card.topicId === activeTopic.id)
  const activeMastery = topicMastery[activeTopic.id]

  return (
    <div className="page concepts-page">
      <div className="page-heading-row">
        <div>
          <span className="section-kicker">STRUCTURED PHARMACOLOGY</span>
          <h1>흩어진 지식을 <span>하나의 구조</span>로.</h1>
          <p>기전에서 임상 효과까지 연결하고, 각 주장에 근거를 붙였습니다.</p>
        </div>
        <button className="primary-button" onClick={() => onStudy(activeTopic.id)}>
          <Sparkles size={17} /> 선택 주제 학습
        </button>
      </div>

      <div className="library-toolbar">
        <label className="library-search"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="약물, 기전, 개념 검색" /></label>
        <div className="segmented-control" aria-label="숙련도 필터">
          <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>전체</button>
          <button className={filter === 'unstarted' ? 'active' : ''} onClick={() => setFilter('unstarted')}>학습 전</button>
          <button className={filter === 'weak' ? 'active' : ''} onClick={() => setFilter('weak')}>취약</button>
          <button className={filter === 'strong' ? 'active' : ''} onClick={() => setFilter('strong')}>안정</button>
        </div>
        <span className="result-count">{filteredTopics.length}개 모듈</span>
      </div>

      <div className="concept-layout">
        <aside className="topic-browser panel">
          <div className="topic-browser-head"><span>CURRICULUM</span><strong>약리학 모듈</strong></div>
          <div className="topic-browser-list">
            {filteredTopics.map((topic) => (
              <button
                key={topic.id}
                className={activeTopic.id === topic.id ? 'active' : ''}
                onClick={() => onSelectTopic(topic.id)}
              >
                <span className={`topic-mini-icon ${topic.tone}`}><TopicIcon topic={topic} size={18} /></span>
                <span><strong>{topic.name}</strong><small>{cards.filter((card) => card.topicId === topic.id).length} cards · {topicMastery[topic.id] === null ? '학습 전' : `${topicMastery[topic.id]}%`}</small></span>
                <ChevronRight size={16} />
              </button>
            ))}
            {filteredTopics.length === 0 && (
              <div className="empty-filter"><Search size={21} /><p>맞는 모듈이 없습니다.</p><button onClick={() => { setQuery(''); setFilter('all') }}>필터 초기화</button></div>
            )}
          </div>
        </aside>

        <section className="concept-detail panel">
          <div className="concept-cover">
            <div className={`concept-cover-icon ${activeTopic.tone}`}><TopicIcon topic={activeTopic} size={28} /></div>
            <div>
              <span>{activeTopic.englishName}</span>
              <h2>{activeTopic.name}</h2>
              <p>{activeTopic.description}</p>
            </div>
            <div className="mastery-dial" style={{ '--mastery': `${activeMastery ?? 0}%` } as React.CSSProperties}>
              <span>{activeMastery === null ? <strong>—</strong> : <><strong>{activeMastery}</strong>%</>}</span>
              <small>{activeMastery === null ? '학습 전' : '기억 안정도'}</small>
            </div>
          </div>

          <div className="concept-tabs">
            <button className="active">개념 지도</button>
            <button onClick={() => onStudy(activeTopic.id)}>플래시카드 <span>{activeCards.length}</span></button>
            <button>근거 노트</button>
          </div>

          <div className="map-section">
            <div className="subheading"><div><span>CORE PATHWAY</span><h3>핵심 연결 지도</h3></div><em><CircleDot size={14} /> 개념을 순서대로 읽어보세요</em></div>
            <div className="concept-map">
              {(conceptLinks[activeTopic.id] ?? []).map((node, index, list) => (
                <div className="concept-node-wrap" key={node.label}>
                  <article className={index === 0 ? 'concept-node emphasized' : 'concept-node'}>
                    <span>{String(index + 1).padStart(2, '0')}</span>
                    <strong>{node.label}</strong>
                    <p>{node.detail}</p>
                  </article>
                  {index < list.length - 1 && <ArrowRight className="map-arrow" size={18} />}
                </div>
              ))}
            </div>
          </div>

          <div className="concept-info-grid">
            <article className="high-yield-card">
              <span className="info-card-icon"><BookOpenCheck size={19} /></span>
              <div><em>HIGH-YIELD IDEA</em><h4>{activeTopic.highYield}</h4><p>공식보다 인과관계를 먼저 회상하면 임상 사례에도 적용하기 쉽습니다.</p></div>
            </article>
            <article className="checklist-card">
              <span className="info-card-icon"><Layers3 size={19} /></span>
              <div><em>KEY CONCEPTS</em><ul>{activeTopic.concepts.map((concept) => <li key={concept}><Check size={13} />{concept}</li>)}</ul></div>
            </article>
          </div>

          <div className="concept-evidence-row">
            <div><FileText size={17} /><span><strong>연결된 근거</strong><small>영문 학술 문헌 · 원문 링크 제공</small></span></div>
            {activeCards.length > 0 ? (
              <SourceLink {...activeCards[0].source} compact />
            ) : (
              <span className="pending-source">논문 탐색에서 근거 추가</span>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
