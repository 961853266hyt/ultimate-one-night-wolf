/**
 * 用官方卡图做的角色牌，三种：
 * - RoleArtCard：只有卡图的大牌，看牌时翻开的牌、夜里放大的底牌用它，点一下打开角色详情
 * - RoleDetailCard：一样大的牌，底下写着名字、阵营和角色介绍，角色详情弹窗用它；小号的给看牌时按住查看用
 * - RoleThumbnail：小的缩略图，揭晓时的底牌用它
 */
import type { RoleId } from '@/api/types'
import { cn } from '@/lib/utils'
import { roleArt } from '@/roles/art'
import { ROLES, TEAMS } from '@/roles/catalog'
import { useT } from '@/i18n'

/** 只有卡图的大牌。宽度、阴影之类由 className 决定，高度按卡图的比例算。 */
export function RoleArtCard({ role, className }: { role: RoleId; className?: string }) {
  return (
    // isolate：Safari 才会用圆角裁掉里面放大过的图
    <div className={cn('relative isolate aspect-[200/274] w-74 overflow-hidden rounded-[24px] shadow-2xl', className)}>
      <CardArt role={role} />
    </div>
  )
}

interface RoleDetailCardProps {
  role: RoleId
  /** md 是详情弹窗里的大牌（296px）；sm 是看牌时按住查看的小牌（208px），字跟着小一号。 */
  size?: 'md' | 'sm'
  /** 阴影之类。 */
  className?: string
  /** 角色名和介绍的 id，弹窗拿去做 aria-labelledby、aria-describedby。 */
  titleId?: string
  descriptionId?: string
}

/**
 * 角色详情的牌：和 RoleArtCard 一样大，卡图铺满；名字、阵营和角色介绍贴在底下，往上渐变盖在卡图上。
 * 介绍短的露出更多卡图，长的（化身幽灵）往上多盖一些，牌的大小都一样。
 * 套一层 dark：不管页面是浅色还是深色，牌都是深色的，阵营色取深色主题的值。
 */
export function RoleDetailCard({ role, size = 'md', className, titleId, descriptionId }: RoleDetailCardProps) {
  const { name, team, ability, teamNote } = ROLES[role]
  const { name: teamName, textClass } = TEAMS[team]
  const s = DETAIL_SIZES[size]
  return (
    <div
      className={cn(
        'dark relative isolate aspect-[200/274] overflow-hidden bg-card text-card-foreground shadow-2xl',
        s.card,
        className,
      )}
    >
      <CardArt role={role} />
      {/* 文字底下垫一层从下往上的渐变：文字那一截是实色，上面一截慢慢透出卡图 */}
      <div className={cn('absolute inset-x-0 bottom-0 flex flex-col bg-linear-to-t from-card from-55% to-transparent', s.body)}>
        {/* 阵营放在名字右边，放不下（英文的化身幽灵）就换到下一行 */}
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <h2 id={titleId} className={cn('font-semibold tracking-wide whitespace-nowrap', s.name)}>
            {name}
          </h2>
          {/* 化身幽灵的阵营不固定，写一句说明；皮匠自成一队，队名就是角色名，不重复写 */}
          {teamNote ? (
            <span className={cn('text-muted-foreground', s.team)}>{teamNote}</span>
          ) : (
            teamName !== name && (
              <span className={cn('shrink-0 rounded-full bg-current/15 px-2.5 py-0.5', s.team, textClass)}>
                {teamName}
              </span>
            )
          )}
        </div>
        <p id={descriptionId} className={isLong(ability) ? s.longAbility : s.ability}>
          {ability}
        </p>
      </div>
    </div>
  )
}

const DETAIL_SIZES = {
  md: {
    card: 'w-74 rounded-[24px]',
    body: 'gap-3 px-5.5 pt-20 pb-6',
    name: 'text-[26px] leading-8',
    team: 'text-xs',
    ability: 'text-[15px] leading-relaxed',
    longAbility: 'text-[13px] leading-normal',
  },
  sm: {
    card: 'w-52 rounded-[17px]',
    body: 'gap-2 px-4 pt-10 pb-4',
    name: 'text-xl leading-7',
    team: 'text-[11px]',
    ability: 'text-[13px] leading-normal',
    longAbility: 'text-[11px] leading-snug',
  },
}

/**
 * 介绍特别长（化身幽灵、英文的模仿者）时字小一号，免得把整张卡图盖满、甚至放不下。
 * 中文字比英文字母宽一倍，按两个算。
 */
function isLong(text: string): boolean {
  const width = [...text].reduce((sum, char) => sum + (/[\u3000-\u9fff\uff00-\uffef]/.test(char) ? 2 : 1), 0)
  return width > 160
}

/** 铺满父元素的卡图，从顶上对齐；没有卡图时是线条图标加角色名。 */
function CardArt({ role }: { role: RoleId }) {
  const t = useT()
  const art = roleArt(role)
  const { name, icon: Icon } = ROLES[role]
  if (!art) {
    return (
      <div className="flex size-full flex-col items-center justify-center gap-3 bg-muted text-muted-foreground">
        <Icon aria-hidden className="size-16" strokeWidth={1.25} />
        <span className="text-lg font-semibold text-foreground">{name}</span>
      </div>
    )
  }
  return (
    // 卡图四个角外面是白底或透明，狼人那张右下角还有一道浅色边：放大 5%、往右下挪 1px，
    // 再用 24px 的圆角裁，四个角就只剩卡面。这组数是对着现有的卡图逐像素算出来的
    <img
      src={art}
      alt={t.card.art(name)}
      draggable={false}
      className="size-full translate-x-px translate-y-px scale-[1.05] object-cover object-top"
    />
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
      {/* 卡图上的英文名缩小后看不清，底下补一条名字，颜色表示阵营；阵营不固定的用白色 */}
      <span
        className={cn(
          // 英文名比中文长（Troublemaker），两边留白和字距收紧一点；还放不下就在软连字符处断成两行
          'absolute inset-x-0 bottom-0 overflow-hidden bg-linear-to-t from-black/85 via-black/60 to-transparent px-0.5 pt-5 pb-1.5 text-center text-[11px] leading-none font-semibold tracking-tight',
          teamNote ? 'text-white' : TEAMS[team].textClass,
        )}
      >
        {name}
      </span>
    </span>
  )
}
