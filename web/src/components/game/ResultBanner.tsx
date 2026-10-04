import { Badge } from '@/components/ui/badge'
import type { Phrase } from '@/game/phrase'
import { PhraseText } from './RoleText'

interface ResultBannerProps {
  headline: string
  /** 我赢了还是输了；旁观的人是 null。 */
  outcome: 'won' | 'lost' | null
  /** 标题下面的几句说明。 */
  summary: readonly Phrase[]
}

/** 揭晓页顶部：输赢、哪个阵营获胜、一句话讲清楚发生了什么。 */
export function ResultBanner({ headline, outcome, summary }: ResultBannerProps) {
  return (
    <header className="flex flex-col items-center gap-2 text-center">
      {outcome === 'won' && <Badge className="bg-success/10 text-success">你赢了</Badge>}
      {outcome === 'lost' && <Badge variant="destructive">你输了</Badge>}
      <h1 className="text-[30px] leading-tight font-semibold">{headline}</h1>
      {summary.map((line, index) => (
        <p key={index} className="text-sm text-muted-foreground">
          <PhraseText phrase={line} />
        </p>
      ))}
    </header>
  )
}
