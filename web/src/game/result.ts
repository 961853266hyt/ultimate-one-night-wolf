/** 揭晓页要展示的内容，全部从服务端的 ResultView 算出来。 */
import {
  CENTER,
  type Copied,
  type PlayerView,
  type ResultView,
  type Revealed,
  type RoleId,
  type SawCard,
  type Shifted,
  type Swapped,
} from '@/api/types'
import { t } from '@/i18n'
import { TEAMS } from '@/roles/catalog'
import { describeCopy } from './knowledge'
import { joinPhrases, type Phrase } from './phrase'
import { centerLetter, seatsOf, slotLabeler, type Seat, type SlotLabeler } from './seats'

/** 一张牌最后算作什么角色：模仿者、化身幽灵的牌算作他们变成的角色，谁拿着都一样。 */
export function countsAs(result: ResultView, role: RoleId): RoleId {
  return result.counts_as[role] ?? role
}

/** 这张牌是模仿者或化身幽灵、而且变过时，算作的角色；否则是 null。 */
function copiedRole(result: ResultView, role: RoleId): RoleId | null {
  return result.counts_as[role] ?? null
}

export interface SeatResult {
  seat: Seat
  dealt: RoleId
  final: RoleId
  /** 最后拿着化身幽灵的牌时，这张牌算作的角色。 */
  copied: RoleId | null
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
      copied: copiedRole(result, result.final[seat.id]),
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
  /** 化身幽灵的牌最后在底牌里时，这张牌算作的角色。 */
  copied: RoleId | null
}

export function centerResults(result: ResultView): CenterResult[] {
  return CENTER.map((slot) => ({
    slot,
    letter: centerLetter(slot),
    dealt: result.dealt[slot],
    final: result.final[slot],
    copied: copiedRole(result, result.final[slot]),
  }))
}

/** 「狼人阵营获胜」。 */
export function headline(result: ResultView): string {
  return t().reveal.headline(result.winning_teams.map((team) => TEAMS[team].name))
}

/**
 * 这局投没投票。投票要全员投完才揭晓，所以一张票都没有，
 * 就是夜里过后玩家手里没有狼人阵营（只剩好人，可能还有皮匠）、天一亮直接结束、大家一起赢的那种局。
 */
export function hadVote(result: ResultView): boolean {
  return Object.keys(result.votes).length > 0
}

/** 标题下面的两行：谁出局了，狼牌最后在谁手里。没投票的局不用写。 */
export function outcomeSeats(seats: readonly SeatResult[], result: ResultView) {
  return {
    out: seats.filter((seat) => seat.out),
    wolves: seats.filter((seat) => countsAs(result, seat.final) === 'werewolf'),
  }
}

export interface NightLogLine {
  step: RoleId
  text: Phrase
  /** 超时了，由系统代选。 */
  auto: boolean
}

/**
 * 夜里每一次行动，按发生的先后。女巫这样分两次行动的角色，一次一句。
 *
 * 一句话由两半组成：做了什么（化身成谁、换了谁的牌），看到了什么，都取自这次行动得知的信息
 * （entry.learned）。比如「2 号阿杰和你换了牌，看到自己现在是狼人」。
 */
export function nightLog(view: PlayerView, result: ResultView): NightLogLine[] {
  const label = slotLabeler(view)
  const text = t().log
  return result.night_log.map((entry) => {
    const actor = entry.player
    const clauses: Phrase[] = [
      ...entry.learned
        .filter((fact): fact is Copied => fact.type === 'copied')
        .map((fact) => describeCopy(fact, label)),
      ...entry.learned
        .filter((fact): fact is Swapped => fact.type === 'swapped')
        .map((fact): Phrase => [describeSwap(fact, actor, label)]),
      ...entry.learned
        .filter((fact): fact is Shifted => fact.type === 'shifted')
        .map((fact): Phrase => [text.shifted(fact.direction === 'next')]),
      ...entry.learned
        .filter((fact): fact is Revealed => fact.type === 'revealed')
        .map((fact) => text.revealed(label(fact.slot), fact.role, fact.face_up)),
    ]
    const seen = entry.learned
      .filter((fact): fact is SawCard => fact.type === 'saw_card')
      .map((fact) => sighting(fact, actor, label))
    if (seen.length) clauses.push([text.saw, ...joinPhrases(seen, t().reveal.listSeparator)])
    if (clauses.length === 0) clauses.push([text.picked(entry.targets.map(label))])

    return {
      step: entry.step,
      auto: entry.auto,
      text: text.sentence(label(actor), joinPhrases(clauses, text.clauseSeparator)),
    }
  })
}

/** 「和 2 号阿杰换了牌」「交换了 2 号阿杰和 A 号底牌的牌」。 */
function describeSwap(fact: Swapped, actor: string, label: SlotLabeler): string {
  const [a, b] = fact.slots
  if (a === actor) return t().log.swappedWith(label(b))
  if (b === actor) return t().log.swappedWith(label(a)) // 女巫把底牌换给了自己
  return t().log.swapped(label(a), label(b))
}

/** 看到的一张牌，比如「A 号底牌是狼人」「自己现在是狼人」。 */
function sighting(fact: SawCard, actor: string, label: SlotLabeler): Phrase {
  return fact.slot === actor ? t().log.sawSelf(fact.role) : t().log.sawSlot(label(fact.slot), fact.role)
}
