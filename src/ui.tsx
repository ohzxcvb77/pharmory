import {
  Activity,
  AlertTriangle,
  Beaker,
  Brain,
  Droplets,
  HeartPulse,
  Pill,
  ShieldPlus,
  Target,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Topic } from './types'

const topicIconMap: Record<string, LucideIcon> = {
  flask: Beaker,
  heart: HeartPulse,
  shield: ShieldPlus,
  droplet: Droplets,
  brain: Brain,
  pill: Pill,
  target: Target,
  alert: AlertTriangle,
}

export function TopicIcon({ topic, size = 20 }: { topic: Topic; size?: number }) {
  const Icon = topicIconMap[topic.icon] ?? Activity
  return <Icon size={size} strokeWidth={1.9} />
}

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? 'brand-mark compact' : 'brand-mark'} aria-label="Pharmory">
      <span className="brand-symbol" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
      {!compact && (
        <span className="brand-copy">
          <strong>pharmory</strong>
          <small>evidence to memory</small>
        </span>
      )}
    </div>
  )
}

export function SourceLink({
  title,
  journal,
  year,
  url,
  compact = false,
}: {
  title: string
  journal: string
  year: number | string
  url: string
  compact?: boolean
}) {
  return (
    <a
      className={compact ? 'source-link compact' : 'source-link'}
      href={url}
      target="_blank"
      rel="noreferrer"
      title={title}
    >
      <span className="source-dot" />
      <span>{compact ? `${journal} · ${year}` : title}</span>
    </a>
  )
}
