/** 揭晓页要展示的内容，全部从服务端的 ResultView 算出来。 */
import {
  CENTER,
  type NightLogEntry,
  type PlayerView,
  type ResultView,
  type RoleId,
  type SawCard,
} from '@/api/types'
import { ROLES, TEAMS } from '@/roles/catalog'
import { joinPhrases, mention, type Phrase } from './phrase'
import { centerLetter, seatsOf, slotLabeler, type Seat, type SlotLabeler } from './seats'

export interface SeatResult {
  seat: Seat
  dealt: RoleId
  final: RoleId
  /** 得了几票。 */
  votes: number
  /** 投给了几号；没投就是 null。 */
  votedFor: number | null
  out: boolean
  won: boolean
}

export function seatResults(view: PlayerView, result: ResultView): SeatResult[] {
  const seats = seatsOf(view)
  const numberOf = new Map(seats.map((seat) => [seat.id, seat.number]))
  const received = new Map<string, number>()
  for (const target of Object.values(result.votes)) {
    received.set(target, (received.get(target) ?? 0) + 1)
  }

  return seats.map((seat) => {
    const target = result.votes[seat.id]
    return {
      seat,
      dealt: result.dealt[seat.id],
      final: result.final[seat.id],
      votes: received.get(seat.id) ?? 0,
      votedFor: target ? (numberOf.get(target) ?? null) : null,
      out: result.deaths.includes(seat.id),
      won: result.winners.includes(seat.id),
    }
  })
}

export interface CenterResult {
  slot: string
  letter: string
  dealt: RoleId
  final: RoleId
}

export function centerResults(result: ResultView): CenterResult[] {
  return CENTER.map((slot) => ({
    slot,
    letter: centerLetter(slot),
    dealt: result.dealt[slot],
    final: result.final[slot],
  }))
}

/** 「狼人阵营获胜」。 */
export function headline(result: ResultView): string {
  if (result.winning_teams.length === 0) return '没有人获胜'
  return `${result.winning_teams.map((team) => TEAMS[team].name).join('、')}获胜`
}

/**
 * 这局投没投票。投票要全员投完才揭晓，所以一张票都没有，
 * 就是夜里过后玩家全是好人、天一亮直接结束的那种局。
 */
export function hadVote(result: ResultView): boolean {
  return Object.keys(result.votes).length > 0
}

/** 标题下面的两句话：谁出局了、最后拿的是什么牌；狼牌最后在谁手里。没投票的局只有一句。 */
export function outcomeSummary(view: PlayerView, result: ResultView): Phrase[] {
  if (!hadVote(result)) return [['夜里过后玩家手里全是好人，不用投票']]

  const label = slotLabeler(view)

  const deaths: Phrase = result.deaths.length
    ? [
        '出局：',
        ...joinPhrases(
          result.deaths.map((id) => [`${label(id)}（`, mention(result.final[id]), '）']),
          '、',
        ),
      ]
    : ['没有人出局']

  const wolves = seatsOf(view).filter((seat) => result.final[seat.id] === 'werewolf')
  const werewolves: Phrase = wolves.length
    ? [`狼人：${wolves.map((seat) => label(seat.id)).join('、')}`]
    : ['没有玩家拿着狼牌']

  return [deaths, werewolves]
}

export interface NightLogLine {
  step: RoleId
  text: Phrase
  /** 超时了，由系统代选。 */
  auto: boolean
}

/**
 * 夜里每一次行动，按发生的先后。
 *
 * 一句话由两半组成：做了什么（换牌之类，见 RoleInfo.describeAction），看到了什么（从这一步得知的信息里找）。
 * 比如「2 号阿杰和你换了牌，看到自己现在是狼人」。
 */
export function nightLog(view: PlayerView, result: ResultView): NightLogLine[] {
  const label = slotLabeler(view)
  return result.night_log.map((entry) => {
    const targets = entry.targets.map(label)
    const action = ROLES[entry.step].describeAction?.(targets)
    const seen = sightings(entry, result, label)

    const clauses: Phrase[] = []
    if (action) clauses.push([action])
    if (seen.length) clauses.push(['看到', ...joinPhrases(seen, '、')])
    if (clauses.length === 0) clauses.push([`选了${targets.join('、')}`])

    return {
      step: entry.step,
      auto: entry.auto,
      text: [label(entry.player), ...joinPhrases(clauses, '，')],
    }
  })
}

/** 这次行动看到的每张牌，比如「A 号底牌是狼人」。 */
function sightings(entry: NightLogEntry, result: ResultView, label: SlotLabeler): Phrase[] {
  return (result.knowledge[entry.player] ?? [])
    .filter((fact): fact is SawCard => fact.type === 'saw_card' && fact.step === entry.step)
    .map((fact) => [
      fact.slot === entry.player ? '自己现在是' : `${label(fact.slot)}是`,
      mention(fact.role),
    ])
}
