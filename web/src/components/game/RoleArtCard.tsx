/**
 * 用官方卡图做的角色牌：大牌点一下盖上一层毛玻璃，显示角色说明，再点一下收起；
 * 另外还有一个小的缩略图。大牌用在角色详情弹窗和看牌时翻开的牌，缩略图用在揭晓时的底牌。
 */
import { useId } from 'react'
import type { RoleId } from '@/api/types'
import { cn } from '@/lib/utils'
import { roleArt } from '@/roles/art'
import { ROLES, TEAMS } from '@/roles/catalog'

interface RoleArtCardProps {
  role: RoleId
  /** 说明是不是展开着，盖在卡图上。 */
  expanded: boolean
  onToggle: () => void
  /** 这局夜里第几个醒，写在说明里；null 是夜里不醒，不传就不写。 */
  wakeOrder?: number | null
  /** 角色名和能力说明的 id，弹窗拿去做 aria-labelledby、aria-describedby。 */
  titleId?: string
  descriptionId?: string
  /** 宽度、阴影之类；高度按卡图的比例算。 */
  className?: string
}

export function RoleArtCard({
  role,
  expanded,
  onToggle,
  wakeOrder,
  titleId,
  descriptionId,
  className,
}: RoleArtCardProps) {
  const detailsId = useId()
  const art = roleArt(role)
  const { name, team, icon: Icon, ability, notes, teamNote } = ROLES[role]
  const { name: teamName, textClass } = TEAMS[team]

  return (
    // isolate：Safari 才会用圆角裁掉里面放大、模糊过的图
    <div
      className={cn(
        'relative isolate aspect-[200/274] w-74 overflow-hidden rounded-[24px] shadow-2xl',
        className,
      )}
    >
      {art ? (
        // 卡图四个角外面是白底或透明，狼人那张右下角还有一道浅色边：放大 5%、往右下挪 1px，
        // 再用 24px 的圆角裁，四个角就只剩卡面。这组数是对着现有的卡图逐像素算出来的
        <img
          src={art}
          alt={`${name}的卡牌`}
          draggable={false}
          className="size-full translate-x-px translate-y-px scale-[1.05] object-cover"
        />
      ) : (
        <div className="flex size-full flex-col items-center justify-center gap-3 bg-muted text-muted-foreground">
          <Icon aria-hidden className="size-16" strokeWidth={1.25} />
          <span className="text-lg font-semibold text-foreground">{name}</span>
        </div>
      )}

      {/* 毛玻璃盖满整张牌。套一层 dark：文字和阵营色都取深色主题的值，在深色玻璃上才看得清 */}
      <div
        id={detailsId}
        className={cn(
          'dark absolute inset-0 flex flex-col bg-background p-6 text-foreground transition-[opacity,visibility] duration-300 motion-reduce:transition-none',
          expanded ? 'visible opacity-100' : 'invisible opacity-0',
        )}
      >
        {/* 玻璃是同一张卡图放大、模糊、压暗做的，不用 backdrop-filter：它在 Safari 上不跟着牌的圆角裁，
            边上还会混进牌外面的颜色，圆角就和正面不一样了 */}
        {art && (
          <img
            src={art}
            alt=""
            draggable={false}
            className="absolute inset-0 size-full scale-150 object-cover blur-2xl saturate-150"
          />
        )}
        <div className="absolute inset-0 bg-black/55" />
        <div className="relative my-auto flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <div className="flex items-baseline justify-between gap-3">
              <p id={titleId} className="text-2xl leading-8 font-semibold tracking-wide">
                {name}
              </p>
              {/* 化身幽灵的阵营不固定，写一句说明；皮匠自成一队，队名就是角色名，不重复写 */}
              {teamNote ? (
                <span className="shrink-0 text-xs text-muted-foreground">{teamNote}</span>
              ) : (
                teamName !== name && (
                  <span className={cn('shrink-0 text-xs', textClass)}>{teamName}</span>
                )
              )}
            </div>
            {wakeOrder !== undefined && (
              <p className="text-xs text-muted-foreground">
                {wakeOrder ? `夜里第 ${wakeOrder} 个醒` : '夜里不醒'}
              </p>
            )}
          </div>
          <p id={descriptionId} className="text-[15px] leading-relaxed">
            {ability}
          </p>
          {notes && (
            <ul className="flex flex-col gap-1.5 border-t border-white/15 pt-3 text-[13px] leading-relaxed text-muted-foreground">
              {notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* 透明按钮盖住整张牌：点卡图展开说明，再点收起 */}
      <button
        type="button"
        onClick={onToggle}
        aria-label="角色说明"
        aria-expanded={expanded}
        aria-controls={detailsId}
        className="absolute inset-0 rounded-[inherit] outline-none focus-visible:ring-3 focus-visible:ring-white/60 focus-visible:ring-inset"
      />
    </div>
  )
}

/** 角色牌的缩略图：卡图，底下压一条角色名。 */
export function RoleThumbnail({ role, className }: { role: RoleId; className?: string }) {
  const art = roleArt(role)
  const { name, team, icon: Icon, teamNote } = ROLES[role]
  return (
    // dark：名字的阵营色取深色主题的值，在黑底上才看得清
    <span
      className={cn(
        'dark relative isolate flex aspect-[200/274] w-18 overflow-hidden rounded-[6px] bg-muted',
        className,
      )}
    >
      {art ? (
        // 和大牌一样裁掉卡图四角的白底。缩略图小，按 72px 宽另算：放大 5%、往右下挪 0.5px、圆角 6px
        <img
          src={art}
          alt=""
          draggable={false}
          className="size-full translate-[0.5px] scale-[1.05] object-cover"
        />
      ) : (
        <Icon aria-hidden className="m-auto size-7 text-muted-foreground" strokeWidth={1.5} />
      )}
      {/* 卡图上的英文名缩小后看不清，底下补一条中文名，颜色表示阵营；阵营不固定的用白色 */}
      <span
        className={cn(
          'absolute inset-x-0 bottom-0 bg-linear-to-t from-black/85 via-black/60 to-transparent px-1 pt-5 pb-1.5 text-center text-[11px] leading-none font-semibold',
          teamNote ? 'text-white' : TEAMS[team].textClass,
        )}
      >
        {name}
      </span>
    </span>
  )
}
