import type { LiteraturePaper } from './types'

interface EuropePmcResult {
  id?: string
  source?: string
  pmid?: string
  pmcid?: string
  doi?: string
  title?: string
  authorString?: string
  journalTitle?: string
  journalInfo?: {
    journal?: {
      title?: string
      medlineAbbreviation?: string
    }
  }
  pubYear?: string
  citedByCount?: number
  isOpenAccess?: string
  abstractText?: string
}

const stripMarkup = (value = '') => {
  const doc = new DOMParser().parseFromString(value, 'text/html')
  return doc.body.textContent?.replace(/\s+/g, ' ').trim() ?? ''
}

export async function searchLiterature(query: string): Promise<LiteraturePaper[]> {
  const normalized = query.trim()
  if (!normalized) return []

  const searchQuery = `(${normalized}) AND LANG:eng`
  const endpoint = new URL('https://www.ebi.ac.uk/europepmc/webservices/rest/search')
  endpoint.searchParams.set('query', searchQuery)
  endpoint.searchParams.set('format', 'json')
  endpoint.searchParams.set('pageSize', '12')
  endpoint.searchParams.set('resultType', 'core')

  const response = await fetch(endpoint, { headers: { Accept: 'application/json' } })
  if (!response.ok) throw new Error(`Literature search failed: ${response.status}`)

  const payload = (await response.json()) as {
    resultList?: { result?: EuropePmcResult[] }
  }

  return (payload.resultList?.result ?? []).map((item, index) => ({
    id: item.id ?? item.pmid ?? item.doi ?? `${Date.now()}-${index}`,
    source: item.source ?? 'MED',
    pmid: item.pmid,
    pmcid: item.pmcid,
    doi: item.doi,
    title: stripMarkup(item.title) || 'Untitled article',
    authors: item.authorString ?? 'Authors not listed',
    journal: item.journalTitle ?? item.journalInfo?.journal?.title ?? item.journalInfo?.journal?.medlineAbbreviation ?? 'Journal not listed',
    year: item.pubYear ?? '—',
    citedByCount: item.citedByCount ?? 0,
    isOpenAccess: item.isOpenAccess === 'Y',
    abstract: stripMarkup(item.abstractText),
  }))
}

export function paperUrl(paper: LiteraturePaper) {
  if (paper.pmid) return `https://pubmed.ncbi.nlm.nih.gov/${paper.pmid}/`
  if (paper.pmcid) return `https://europepmc.org/article/PMC/${paper.pmcid}`
  if (paper.doi) return `https://doi.org/${paper.doi}`
  return `https://europepmc.org/article/${paper.source}/${paper.id}`
}
