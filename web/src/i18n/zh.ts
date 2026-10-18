/**
 * 中文文案，也是文案的结构：en.ts 要实现同样的每一条。
 *
 * 带参数的写成函数，各语言按自己的语序拼。要在句子里嵌角色名（按阵营上色、能点开详情）的，
 * 返回 Phrase，见 game/phrase.ts。
 */
import type { ErrorMessage, Phase, Prompt, RoleId, Team, TargetOption } from '@/api/types'
import { mention, type Phrase } from '@/game/phrase'

/** 一个角色的文字。结构（阵营、图标、张数上限……）在 roles/catalog.ts。 */
export interface RoleText {
  name: string
  /** 一句话简介，放在列表里，比如配牌页。 */
  summary: string
  /** 这张牌能做什么。看牌时的大牌和角色详情里展示。 */
  ability: string
  /** 角色详情里补充的规则细节。 */
  notes?: readonly string[]
  /** 阵营不固定时，代替阵营名显示的说明，比如化身幽灵。 */
  teamNote?: string
  /** 夜里轮到你时的提示。不写就按 Prompt 自动生成，比如「选 1 名其他玩家」。 */
  promptHint?: (prompt: Prompt) => string
}

export interface TeamText {
  name: string
  /** 配牌摘要里的简称：「好人 4 · 狼人 2」。 */
  short: string
  /** 怎样算赢。胜负看的是夜里换完之后手里的牌。 */
  goal: string
}

const list = (items: readonly string[]) => items.join('、')

/** 「看了 A 号底牌，变成了」「看了 2 号阿杰的牌，化身成了」，后面接角色名。 */
const copyClause = (looked: string, center: boolean, doppelganger: boolean) =>
  `看了${center ? looked : `${looked}的牌`}，${doppelganger ? '化身成了' : '变成了'}`

export const zh = {
  app: {
    name: '一夜狼',
    loading: '加载中…',
    cannotConnect: '连不上服务器，请稍后刷新重试',
  },

  common: {
    close: '关闭',
    cancel: '取消',
    confirm: '确定',
    menu: '菜单',
    seats: '座位',
    centerCards: '牌堆',
    /** 自己的座位名字后面：「阿杰 · 你」。 */
    youSuffix: ' · 你',
  },

  home: {
    createFailed: '创建失败，请重试',
    creating: '创建中…',
    create: '创建房间',
    roomCode: '房间号',
    join: '加入',
    or: 'or',
    yourName: '你的名字',
    enterRoom: (code: string) => `进入房间 ${code}`,
    enter: '进入',
  },

  menu: {
    roles: '角色介绍',
    teamGroup: (team: string, count: number) => `${team} · ${count}`,
    language: '语言',
    theme: '外观',
    themes: { light: '浅色', dark: '深色', system: '跟随系统' },
    feedback: '反馈问题',
    feedbackBody: (version: string, page: string, device: string) =>
      [
        '**遇到了什么问题**',
        '',
        '',
        '**怎么能再碰到一次**',
        '',
        '',
        '---',
        `版本：v${version}`,
        `页面：${page}`,
        `设备：${device}`,
      ].join('\n'),
    credits: (version: string) => `一夜狼 v${version}`,
  },

  room: {
    backHome: '回首页',
    entering: '正在进入房间…',
    connecting: '正在连接…',
    reconnecting: '重连中…',
    secondsLeft: (seconds: number) => `还剩 ${seconds} 秒`,
    dawn: '天亮了',
    everyoneOpenEyes: '所有人请睁眼',
    leaveRoom: '离开房间',
    leaveTitle: '这一局还没结束，确定离开吗？',
    leaveDescription: '你的座位会保留到这局结束。',
    leave: '离开',
    stay: '留下',
    inviteCopied: '已复制邀请链接',
    inviteFallback: (code: string) => `房间号是 ${code}，告诉朋友就能进来`,
    actAs: '替谁操作',
    me: '我',
    actingAs: (name: string) => `正在替${name}操作，看到的是它的牌和线索`,
  },

  phase: {
    lobby: '等待开始',
    deal: '看牌',
    night: '夜晚',
    day: '白天 · 讨论',
    vote: '投票',
    reveal: '揭晓',
    nightProgress: (index: number, total: number) => `夜晚 · ${index}/${total}`,
  } satisfies Record<Phase, string> & Record<string, unknown>,

  seat: {
    /** 「2 号阿杰」。 */
    label: (number: number, name: string) => `${number} 号${name}`,
    /** 句子里称呼自己。 */
    you: '你',
    /** 句子里称呼一张底牌：「A 号底牌」。 */
    center: (letter: string) => `${letter} 号底牌`,
    /** 机器人的名字，号码是服务端给的。 */
    bot: (number: number) => `机器人${number}`,
    host: '房主',
    botBadge: '机器人',
    ready: '已就位',
    offline: '离线',
    emptyLabel: (number: number) => `${number} 号空座位，换到这里`,
    emptyName: (number: number) => `${number} 空位`,
    tapToTake: '点击换座',
    emptySeat: '空座位',
  },

  lobby: {
    seatsCaption: (taken: number, size: number, canKick: boolean) =>
      `${taken}/${size} 人已入座${canKick ? ' · 点头像可以移出房间' : ''}`,
    invite: '邀请朋友',
    start: '开始游戏',
    kickTitle: (label: string) => `把 ${label} 移出房间？`,
    kickDescription: '被移出的人还可以用房间号重新进来。',
    kick: '移出',
    // 现在界面上不显示，只用来判断能不能开局；留着文案方便以后再用
    needMore: (n: number) => `还差 ${n} 人坐满`,
    offline: (names: readonly string[]) => `${list(names)}离线，回来后才能开始`,
    cardsShort: (n: number) => `牌少了 ${n} 张，补上才能开始`,
    cardsOver: (n: number) => `牌多了 ${n} 张，拿掉才能开始`,
  },

  settings: {
    title: '本局设置',
    roomSize: '房间人数',
    fewerSeats: '少一个座位',
    moreSeats: '多一个座位',
    people: (n: number) => `${n} 人`,
    nightTime: '夜间操作时间',
    seconds: (n: number) => `${n} 秒`,
    secondsShort: (n: number) => `${n}s`,
    selfVote: '可以投自己',
    debug: '调试模式',
    box: '牌库',
    inGame: '本局',
    deckCount: (people: number) => `${people} 人 ·`,
    cards: '张',
    recommended: '按人数推荐',
    resetRecommended: '恢复推荐',
    emptySlot: '空位',
    inDeck: '，已放进本局',
    take: (name: string, pair: boolean) => `把${pair ? '一对' : ''}${name}放进本局`,
    putBack: (name: string, pair: boolean) => `把${pair ? '一对' : ''}${name}放回牌库`,
    save: '保存设置',
    atLeast: (n: number) => `至少要 ${n} 张牌`,
    atMost: (n: number) => `最多 ${n} 张牌`,
    overviewRoles: '角色 · 点头像看介绍',
    overviewNightOrder: '夜里的醒来顺序',
    overviewRest: (seats: number, nightStep: number, selfVote: boolean, debug: boolean) =>
      `房间 ${seats} 人 · ${debug ? '调试模式，夜里不计时' : `夜间操作时间 ${nightStep} 秒`} · ${selfVote ? '可以' : '不能'}投自己，房主可以调整`,
    fillOne: '补一张',
    toFill: '待补',
    summaryTitle: (seats: number, cards: string) => `${seats} 人局 · ${cards}`,
    cardsOf: (count: number, need?: number) => (need === undefined ? `${count} 张` : `${count}/${need} 张`),
    nightTimeSr: '夜间操作',
    /** 摘要条里地方小：「20 秒」。 */
    summaryTime: (n: number) => `${n} 秒`,
  },

  deal: {
    yourCard: '你的身份',
    alreadyStarted: '这一局已经开始了',
    waitNext: '等下一局吧',
    seen: '已看好',
    looking: '看牌中…',
    remembered: '我记住了',
    waitOthers: '等其他人看完…',
    flipYourCard: '翻开你的身份',
    tapToFlip: '点一下翻开',
  },

  night: {
    progress: '夜晚进度',
    endStep: '结束这一步',
    wakeUp: (role: string) => `${role}请睁眼`,
    nightFalls: '天黑了，所有人请闭眼',
    learned: '你得知了新线索，点开下面的「我的线索」看看',
    notYourTurn: '没轮到你 · 随便点点，别让旁人看出来',
    centerCard: (letter: string) => `${letter} 号底牌`,
    flipCenter: (letter: string) => `翻开 ${letter} 号底牌`,
    flipping: '翻开中…',
    putBack: '放回',
    notNow: '先不看',
    /** 按 Prompt 自动生成的提示：「选 1 名其他玩家，或者 2 张底牌（必须选）」。 */
    describePrompt: (options: readonly TargetOption[], required: boolean) => {
      const noun = (option: TargetOption) =>
        option.kind === 'center' ? '张底牌' : option.include_self ? '名玩家（可以是你自己）' : '名其他玩家'
      const choices = options.map((option) => `${option.count} ${noun(option)}`)
      return `选 ${choices.join('，或者 ')}${required ? '（必须选）' : ''}`
    },
  },

  clues: {
    title: '我的线索',
    empty: '夜里得知的信息会记在这里',
    yourCardNow: (role: RoleId): Phrase => ['你现在手里的牌是', mention(role)],
    slotIs: (label: string, role: RoleId): Phrase => [`${label}是`, mention(role)],
    wolfMates: (names: readonly string[]): Phrase => [
      names.length ? `你的狼同伴：${list(names)}` : '你是唯一的狼',
    ],
    wolvesAre: (names: readonly string[]): Phrase => [
      names.length ? `狼是：${list(names)}` : '没有玩家拿着狼牌',
    ],
    alsoRole: (names: readonly string[], role: RoleId): Phrase =>
      names.length ? [`${list(names)}也是`, mention(role)] : ['另一张', mention(role), '在底牌里'],
    youSwappedWith: (other: string): Phrase => [`你和${other}换了牌`],
    youSwapped: (a: string, b: string): Phrase => [`你交换了${a}和${b}的牌`],
    /** 「你看了 A 号底牌，变成了狼人」「你看了 2 号阿杰的牌，化身成了预言家」。 */
    copied: (looked: string, center: boolean, doppelganger: boolean, role: RoleId): Phrase => [
      `你${copyClause(looked, center, doppelganger)}`,
      mention(role),
    ],
  },

  day: {
    nightOrder: '今晚的行动顺序',
    seatsCaption: (identity: string) => `点头像备注${identity}`,
    centerCaption: (identity: string) => `点牌备注${identity}`,
    readyDone: '可以投了',
    discussing: '讨论中',
    readyButton: '开始公投',
    waitOthers: '等其他人…',
  },

  vote: {
    title: '你觉得谁是狼？',
    voted: '投好了，等大家亮票',
    rule: '得票最多且至少 2 票的人出局，平票一起出局',
    seatsCaption: (voted: number, total: number) => `${voted}/${total} 已投票`,
    done: '已投票',
    thinking: '思考中…',
    /** 投票按钮：whom 是 null（还没选）、'self'（自己）或者「3 号阿杰」。 */
    button: (hasVoted: boolean, whom: string | 'self' | null) => {
      const target = whom === 'self' ? '自己' : whom ? ` ${whom}` : null
      if (hasVoted) return target ? `已投给${target}` : '已投票'
      return target ? `投给${target}` : '先选一个人'
    },
  },

  reveal: {
    countsAs: '算作',
    votedFor: (number: number) => `投给 ${number} 号`,
    votedForShort: (number: number) => `${number} 号`,
    whatHappened: '夜里发生了什么',
    rematch: '再来一局',
    waitHost: '等房主开始下一局…',
    wasRole: (role: string) => `原来是${role}`,
    countsAsRole: (role: string) => `算作${role}`,
    win: '胜',
    lose: '负',
    votes: (n: number) => `${n} 票`,
    youWon: '你赢了',
    youLost: '你输了',
    autoPicked: '超时代选',
    headline: (teams: readonly string[]) => (teams.length ? `${list(teams)}获胜` : '没有人获胜'),
    noVote: '夜里过后玩家手里全是好人，不用投票',
    outLabel: '出局',
    noOneOut: '没有人出局',
    wolvesLabel: '狼人',
    noWolves: '没有玩家拿着狼牌',
    listSeparator: '、',
  },

  /** 夜间记录：一句话由「谁」和几个分句组成，比如「2 号阿杰和你换了牌，看到自己现在是狼人」。 */
  log: {
    sentence: (subject: string, clauses: Phrase): Phrase => [subject, ...clauses],
    copied: (looked: string, center: boolean, doppelganger: boolean, role: RoleId): Phrase => [
      copyClause(looked, center, doppelganger),
      mention(role),
    ],
    clauseSeparator: '，',
    swappedWith: (other: string) => `和${other}换了牌`,
    swapped: (a: string, b: string) => `交换了${a}和${b}的牌`,
    saw: '看到',
    sawSelf: (role: RoleId): Phrase => ['自己现在是', mention(role)],
    sawSlot: (label: string, role: RoleId): Phrase => [`${label}是`, mention(role)],
    picked: (labels: readonly string[]) => `选了${list(labels)}`,
  },

  notes: {
    identity: { initial: '初始身份', final: '最终身份' },
    identityShort: { initial: '初始', final: '最终' },
    whichIdentity: '看哪一套身份',
    none: '未备注',
    other: (identity: string, role: string) => `${identity}：${role}`,
    addForSelf: '给自己添加备注',
    addFor: (number: number) => `给 ${number} 号添加备注`,
    addForCenter: (letter: string) => `给 ${letter} 号底牌添加备注`,
    markAs: (role: string) => `标记为${role}`,
    clear: '清除备注',
  },

  card: {
    art: (name: string) => `${name}的卡牌`,
  },

  errors: {
    not_member: '你不在这个房间里',
    not_host: '只有房主可以这样做',
    not_playing: '你没有参加这一局',
    wrong_phase: '现在不能这样做',
    room_full: '房间已经坐满了',
    seat_taken: '这个座位已经有人了',
    too_few_seats: '房间人数不能少于已经进来的人数',
    game_in_progress: '这一局已经开始了，等它结束再进来吧',
    player_count: '座位坐满才能开始',
    players_offline: '还有人不在线',
    deck_size: '牌的数量要比人数多 3 张',
    too_many_copies: '有角色的牌超过了上限',
    unknown_player: '没有这个玩家',
    cannot_kick_self: '不能把自己踢出去',
    not_your_turn: '还没轮到你',
    already_acted: '这一步你已经行动过了',
    bad_targets: '选的目标不对',
    already_voted: '你已经投过票了',
    bad_message: '消息格式不对',
    bad_token: '身份失效了，请回首页重新进入',
    room_not_found: '房间不存在，或者已经解散了',
    removed: '你已经离开了这个房间',
    internal: '服务器出了点问题',
  } satisfies Record<ErrorMessage['code'], string>,

  teams: {
    village: {
      name: '好人阵营',
      short: '好人',
      goal: '只要有一只狼被票出局就赢。如果狼都在底牌里，没有人出局才算赢。',
    },
    werewolf: {
      name: '狼人阵营',
      short: '狼人',
      goal: '没有狼被票出局就赢，但皮匠被票出局时不算赢。',
    },
    tanner: {
      name: '皮匠',
      short: '皮匠',
      goal: '只有自己被票出局才算赢。',
    },
  } satisfies Record<Team, TeamText>,

  roles: {
    copycat: {
      name: '模仿者',
      teamNote: '阵营跟着模仿的角色',
      summary: '看 1 张底牌，变成那个角色',
      ability:
        '夜晚最先睁眼，查看一张底牌，变成看到的角色（获得其技能，但是自己还是保持模仿者的卡牌），之后在那个角色睁眼时与其一起睁眼操作。',
      notes: [
        '模仿者的阵营，与其模仿的角色一致。',
        '如果模仿了化身幽灵，则在化身幽灵阶段睁眼，按化身幽灵的规则化身。',
        '到时间还没选，系统会随机替你选一张。',
      ],
      promptHint: () => '点 1 张底牌翻开，你就变成那个角色（必须选）',
    },
    doppelganger: {
      name: '化身幽灵',
      teamNote: '阵营跟着化身的角色',
      summary: '看 1 名玩家的牌，变成那个角色',
      ability:
        '夜晚在模仿者之后，其他角色之前睁眼，查看一名玩家的牌，化身为看到的角色（获得其技能，但是自己还是保持化身幽灵的卡牌）。如果看到的是狼人、爪牙、守夜人、失眠者，则夜晚与其一起睁眼操作；如果看到的是其他有技能的角色，则立即执行操作。',
      notes: [
        '化身幽灵的阵营，与其化身的角色一致。',
        '如果化身为狼人，则在狼人阶段与狼队友一起睁眼操作。',
        '如果化身为强盗，并且抢到狼人卡牌，化身幽灵不会在狼人阶段一起睁眼操作。',
        '如果化身为模仿者，不能再使用模仿技能，但是最终获胜条件与模仿者一致。',
      ],
      promptHint: () => '看 1 名其他玩家的牌，你就变成那个角色（必须选）',
    },
    werewolf: {
      name: '狼人',
      summary: '和同伴互认；独狼能看 1 张底牌',
      ability: '夜里和其他狼互相确认。如果只有你一只狼，可以看一张底牌。',
      promptHint: () => '你是唯一的狼，可以点 1 张底牌翻开看看',
    },
    minion: {
      name: '爪牙',
      summary: '知道谁是狼，帮狼人赢',
      ability: '夜里知道谁是狼，狼不知道你。狼没被票出去就算你赢，你自己被票出去也没关系。',
      notes: ['如果狼都在底牌里，只要你以外有人被票出局，你就赢。'],
    },
    mason: {
      name: '守夜人',
      summary: '两人互相确认，要成对放',
      ability: '夜里和另一个守夜人互相确认。',
      notes: ['看不到同伴，就说明另一张守夜人在底牌里。'],
    },
    seer: {
      name: '预言家',
      summary: '看 1 名玩家，或者 2 张底牌',
      ability: '夜里可以看一名其他玩家的牌，或者看两张底牌。',
      promptHint: (prompt) =>
        prompt.options.some((option) => option.kind === 'player')
          ? '看 1 名其他玩家的牌，或者点底牌，一张一张翻开 2 张'
          : '再翻开 1 张底牌（必须选）',
    },
    robber: {
      name: '强盗',
      summary: '和 1 人换牌，再看换到了什么',
      ability: '夜里和一名其他玩家换牌，然后看看你换到了什么。到时间没选的话，系统随机替你抢一个。',
      notes: ['换到的牌决定你最后的阵营。被换的人拿到强盗牌，自己并不知道。'],
    },
    witch: {
      name: '女巫',
      summary: '看 1 张底牌，再把它换给任意一人',
      ability: '夜里可以看一张底牌。看了就必须把这张牌和任意一名玩家的牌交换，也可以换给自己。',
      notes: ['换给自己，你就成了那张牌的角色；换给别人，他自己并不知道。', '看了却到时间还没换，系统会随机替你选一名玩家。'],
      promptHint: (prompt) =>
        prompt.options[0]?.kind === 'center'
          ? '可以点 1 张底牌翻开，看了就必须把它换给一名玩家（也可以是你自己）'
          : '把刚看的底牌换给一名玩家，也可以换给自己（必须选）',
    },
    troublemaker: {
      name: '捣蛋鬼',
      summary: '交换另外 2 人的牌，不能看',
      ability: '夜里可以交换另外两名玩家的牌，但不能看。',
      notes: ['被交换的两个人都不知道自己的牌变了。'],
    },
    drunk: {
      name: '酒鬼',
      summary: '和 1 张底牌交换，不能看',
      ability: '夜里必须把自己的牌和一张底牌交换，并且不能看换到了什么。',
      notes: ['到时间还没选，系统会随机替你选一张。'],
    },
    insomniac: {
      name: '失眠者',
      summary: '最后醒来，看自己现在的牌',
      ability: '夜里最后醒来，看看自己现在手里是什么牌。',
    },
    hunter: {
      name: '猎人',
      summary: '出局时，投给的人一起出局',
      ability: '如果你被票出局，你投票指向的那个人也会一起出局。',
      notes: ['被带走的如果也是猎人，会接着带走那个人投的人。'],
    },
    tanner: {
      name: '皮匠',
      summary: '只有自己被票出局才算赢',
      ability: '只有你自己被票出局，你才赢。',
      notes: ['你被票出局时，狼人阵营不能获胜。'],
    },
    villager: {
      name: '村民',
      summary: '没有能力，靠推理',
      ability: '没有夜间能力，靠推理找出狼。',
    },
  } satisfies Record<RoleId, RoleText> as Record<RoleId, RoleText>,
}

export type Messages = typeof zh
