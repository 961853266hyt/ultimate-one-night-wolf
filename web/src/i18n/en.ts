/** English. Implements every entry of zh.ts; role names follow the official English edition. */
import type { TargetOption } from '@/api/types'
import { mention, type Phrase } from '@/game/phrase'
import type { Messages } from './zh'

const list = (items: readonly string[]) => items.join(', ')
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`
/** Labels like "you" or "center card A" start a sentence in lower case. */
const cap = (text: string) => text.charAt(0).toUpperCase() + text.slice(1)
const copyClause = (looked: string, center: boolean, doppelganger: boolean) =>
  `looked at ${center ? looked : `${looked}'s card`} and ${doppelganger ? 'turned into ' : 'became '}`

export const en: Messages = {
  app: {
    name: 'One Night Ultimate Werewolf',
    loading: 'Loading…',
    cannotConnect: "Can't reach the server. Please refresh in a moment.",
  },

  tabs: {
    label: 'Pages',
    home: 'Home',
    roles: 'Roles',
    rooms: 'Rooms',
    settings: 'Settings',
    yourTurn: "It's your turn in the room",
    play: 'Create or join a room',
  },

  rooms: {
    empty: 'Not a single wolf hair in here',
    title: (host) => `${host}'s room`,
    players: (n, seats) => `${n}/${seats} players`,
    lobby: 'Waiting to start',
    reveal: 'A game just ended',
    playing: 'Game in progress',
    back: (code) => `Back to room ${code}`,
    playersOnly: (n) => plural(n, 'player'),
    failed: "Can't reach the server, retrying…",
  },

  rolesPage: {
    team: 'Team',
    tabs: { village: 'Village', werewolf: 'Werewolves', tanner: 'Third party' },
  },

  boards: {
    featured: 'Featured setups',
    howMany: 'How many players',
    seats: (n) => plural(n, 'player'),
    failed: "Couldn't load the setups. Try refreshing the page.",
    meta: (seats, cards, rounds) =>
      `${plural(seats, 'player')} · ${plural(cards, 'card')} · ${rounds ? plural(rounds, 'speaking round') : 'free discussion'}`,
    open: 'Open a room with this setup',
    kinds: {
      starter: 'Starter',
      classic: 'Classic',
      chaos: 'Swap Frenzy',
      tanner: 'Tanner Trouble',
      mason: 'Masons',
      mirror: 'Mirror',
    },
  },

  common: {
    close: 'Close',
    cancel: 'Cancel',
    confirm: 'Confirm',
    seats: 'Seats',
    centerCards: 'Center cards',
    youSuffix: ' · you',
  },

  home: {
    createFailed: "Couldn't create a room. Please try again.",
    creating: 'Creating…',
    create: 'Create room',
    roomCode: 'Room code',
    join: 'Join',
    or: 'or',
    yourName: 'Your name',
    enterRoom: (code) => `Enter room ${code}`,
    enter: 'Enter',
  },

  menu: {
    language: 'Language',
    theme: 'Appearance',
    themes: { light: 'Light', dark: 'Dark', system: 'System' },
    feedback: 'Report a problem',
    coffee: 'Buy me a coffee',
    general: 'General',
    about: 'About',
    updates: {
      checking: 'Checking for updates…',
      latest: "You're up to date",
      available: (version) => `Version ${version} is available`,
      failed: "Couldn't check for updates",
      install: 'Update',
      reload: 'Reload',
    },
    feedbackBody: (version, page, device) =>
      [
        '**What went wrong**',
        '',
        '',
        '**How to make it happen again**',
        '',
        '',
        '---',
        `Version: v${version}`,
        `Page: ${page}`,
        `Device: ${device}`,
      ].join('\n'),
    // 落款地方小，用官方缩写
    credits: (version) => `ONUW v${version}`,
  },

  room: {
    backHome: 'Back to home',
    entering: 'Entering the room…',
    connecting: 'Connecting…',
    reconnecting: 'Reconnecting…',
    secondsLeft: (seconds) => `${plural(seconds, 'second')} left`,
    dawn: 'Day breaks',
    everyoneOpenEyes: 'Everyone, open your eyes',
    leaveRoom: 'Leave room',
    leaveTitle: "This game isn't over yet. Leave anyway?",
    leaveTitleIdle: 'Leave this room?',
    leaveDescription: 'Your seat is kept until the game ends.',
    leave: 'Leave',
    stay: 'Stay',
    inviteCopied: 'Invite link copied',
    inviteFallback: (code) => `The room code is ${code}. Share it with your friends.`,
    actAs: 'Act as',
    me: 'Me',
    actingAs: (name) => `Acting as ${name}: you see its card and clues`,
  },

  phase: {
    lobby: 'Waiting to start',
    deal: 'Look at your card',
    night: 'Night',
    day: 'Day · Discussion',
    vote: 'Vote',
    reveal: 'Reveal',
    nightProgress: (index, total) => `Night · ${index}/${total}`,
  },

  seat: {
    label: (number, name) => `#${number} ${name}`,
    you: 'you',
    center: (letter) => `center card ${letter}`,
    bot: (number) => `Bot ${number}`,
    host: 'Host',
    botBadge: 'Bot',
    ready: 'Ready',
    offline: 'Offline',
    emptyLabel: (number) => `Empty seat ${number}, move here`,
    emptyName: (number) => `Seat ${number}`,
  },

  lobby: {
    spectators: 'Spectators',
    watch: 'Watch',
    invite: 'Invite friends',
    start: 'Start game',
    kickTitle: (label) => `Remove ${label} from the room?`,
    kickDescription: 'They can come back with the room code.',
    kick: 'Remove',
    needMore: (n) => `${n} more to fill every seat`,
    offline: (names) => `${list(names)} ${names.length === 1 ? 'is' : 'are'} offline. Start once they're back.`,
    cardsShort: (n) => `${plural(n, 'card')} short`,
    cardsOver: (n) => `${plural(n, 'card')} too many`,
  },

  settings: {
    title: 'Game settings',
    roomSize: 'Players',
    fewerSeats: 'One fewer seat',
    moreSeats: 'One more seat',
    people: (n) => `${n}`,
    nightTime: 'Timer',
    seconds: (n) => plural(n, 'second'),
    secondsShort: (n) => `${n}s`,
    selfVote: 'Can vote for yourself',
    speechRounds: 'Speaking rounds',
    speechOff: 'Off',
    speechRoundsLabel: (n) => (n ? plural(n, 'round') : 'No speaking order'),
    public: 'Public room',
    debug: 'Debug mode',
    box: 'Card box',
    inGame: 'This game',
    deckCount: (people) => `${plural(people, 'player')} ·`,
    cards: 'cards',
    recommended: 'Recommended',
    resetRecommended: 'Use recommended',
    emptySlot: 'Empty',
    inDeck: ', in this game',
    take: (name, pair) => `Add ${pair ? 'a pair of ' : ''}${name} to this game`,
    putBack: (name, pair) => `Put ${pair ? 'the pair of ' : ''}${name} back in the box`,
    save: 'Save settings',
    atLeast: (n) => `At least ${n} cards`,
    atMost: (n) => `At most ${n} cards`,
    overviewRoles: 'Roles',
    overviewNightOrder: 'Night wake order',
    overviewRest: (seats, nightStep, selfVote, debug, speechRounds, isPublic) =>
      `${plural(seats, 'player')} · ${debug ? 'debug mode, no night timer' : `${nightStep}s per night step`} · ${speechRounds ? `${plural(speechRounds, 'speaking round')} by day` : 'free discussion by day'} · voting for yourself ${selfVote ? 'allowed' : 'not allowed'} · ${isPublic ? 'public room' : 'private, join by code'}`,
    fillOne: 'Add one',
    toFill: 'Needed',
    summaryTitle: (seats, cards) => `${seats}-player game · ${cards}`,
    summaryBoard: (seats, board) => `${plural(seats, 'player')} · ${board}`,
    cardsOf: (count, need) => (need === undefined ? plural(count, 'card') : `${count}/${need} cards`),
    nightTimeSr: 'Night timer',
    summaryTime: (n) => `${n}s`,
  },

  deal: {
    yourCard: 'Your role',
    watching: "You're watching",
    waitNext: 'Wait for the next one',
    seen: 'Done',
    looking: 'Looking…',
    remembered: 'Got it',
    waitOthers: 'Waiting for the others…',
    holdToView: 'Hold to view',
    tapToFlip: 'Tap to flip',
  },

  night: {
    progress: 'Night progress',
    endStep: 'End this step',
    wakeUp: (role) => `${role}, wake up`,
    nightFalls: 'Night falls. Everyone, close your eyes.',
    learned: 'You learned something new',
    notYourTurn: "Not your turn · tap around so nobody can tell",
    watching: "You're watching",
    centerCard: (letter) => `Center card ${letter}`,
    flipCenter: (letter) => `Flip center card ${letter}`,
    flipping: 'Flipping…',
    direction: 'Direction',
    directions: { next: 'Pass to the next seat', previous: 'Pass to the previous seat' },
    putBack: 'Put back',
    notNow: 'Not now',
    describePrompt: (options: readonly TargetOption[], required) => {
      const noun = (option: TargetOption) => {
        if (option.kind === 'center') return option.count === 1 ? 'center card' : 'center cards'
        const players = option.count === 1 ? 'player' : 'players'
        return option.include_self ? `${players} (you may pick yourself)` : `other ${players}`
      }
      const choices = options.map((option) => `${option.count} ${noun(option)}`)
      return `Pick ${choices.join(', or ')}${required ? ' (required)' : ''}`
    },
  },

  clues: {
    title: 'My clues',
    empty: 'What you learn at night shows up here',
    yourCardNow: (role) => ['Your card is now ', mention(role)],
    slotIs: (label, role) => [`${cap(label)} is `, mention(role)],
    wolfMates: (names) => [names.length ? `Your fellow werewolves: ${list(names)}` : "You're the only werewolf"],
    wolvesAre: (names) => [names.length ? `The werewolves are: ${list(names)}` : 'No player holds a werewolf card'],
    alsoRole: (names, role): Phrase =>
      names.length
        ? [`${list(names)} ${names.length === 1 ? 'is' : 'are'} also `, mention(role)]
        : ['The other ', mention(role), ' is in the center'],
    youSwappedWith: (other) => [`You swapped cards with ${other}`],
    youSwapped: (a, b) => [`You swapped ${a}'s and ${b}'s cards`],
    youShifted: (next) => [`You passed everyone else's card to the ${next ? 'next' : 'previous'} seat`],
    youRevealed: (label, role, faceUp) => [
      `You flipped ${label}'s card: `,
      mention(role),
      faceUp ? ', face up for everyone' : ', turned back face down',
    ],
    copied: (looked, center, doppelganger, role) => [
      `You ${copyClause(looked, center, doppelganger)}`,
      mention(role),
    ],
  },

  day: {
    nightOrder: "Tonight's wake order",
    readyDone: 'Ready',
    discussing: 'Discussing',
    readyButton: 'Start the vote',
    speaking: (round, rounds) => `Round ${round}/${rounds} · `,
    speakingSuffix: ' is speaking',
    endSpeech: 'Done speaking',
    endSpeechFor: (label) => `End ${label}'s turn`,
    waitOthers: 'Waiting for the others…',
  },

  vote: {
    done: 'Voted',
    thinking: 'Thinking…',
    button: (hasVoted, whom) => {
      const target = whom === 'self' ? 'yourself' : whom
      if (hasVoted) return target ? `Voted for ${target}` : 'Voted'
      return target ? `Vote for ${target}` : 'Pick someone first'
    },
  },

  reveal: {
    countsAs: 'counts as',
    votedFor: (number) => `voted for #${number}`,
    votedForShort: (number) => `#${number}`,
    dealtLabel: 'Dealt',
    whatHappened: 'What happened at night',
    rematch: 'Play again',
    waitHost: 'Waiting for the host to start the next game…',
    wasRole: (role) => `was ${role}`,
    countsAsRole: (role) => `counts as ${role}`,
    win: 'Won',
    lose: 'Lost',
    votes: (n) => plural(n, 'vote'),
    youWon: 'You won',
    youLost: 'You lost',
    autoPicked: 'Auto-picked',
    headline: (teams) => (teams.length ? `${teams.join(' & ')} ${teams.length === 1 ? 'wins' : 'win'}` : 'Nobody wins'),
    noVote: 'After the night no player held a werewolf-team card, so there was no vote',
    everyoneWins: 'Everyone wins',
    outLabel: 'Out',
    noOneOut: 'Nobody is out',
    wolvesLabel: 'Werewolves',
    noWolves: 'No player holds a werewolf card',
    listSeparator: ', ',
  },

  log: {
    sentence: (subject, clauses) => [cap(subject), ' ', ...clauses],
    copied: (looked, center, doppelganger, role) => [copyClause(looked, center, doppelganger), mention(role)],
    clauseSeparator: ', ',
    swappedWith: (other) => `swapped cards with ${other}`,
    swapped: (a, b) => `swapped ${a}'s and ${b}'s cards`,
    shifted: (next) => `passed everyone else's card to the ${next ? 'next' : 'previous'} seat`,
    revealed: (label, role, faceUp) => [
      `flipped ${label}'s card: `,
      mention(role),
      faceUp ? ', left face up' : ', turned back face down',
    ],
    saw: 'saw ',
    sawSelf: (role) => ['their own card is now ', mention(role)],
    sawSlot: (label, role) => [`${label} is `, mention(role)],
    dealt: (label, role) => [`${cap(label)}: `, mention(role)],
    picked: (labels) => `picked ${list(labels)}`,
  },

  notes: {
    identity: { initial: 'Starting role', final: 'Final role' },
    identityShort: { initial: 'Start', final: 'Final' },
    whichIdentity: 'Which roles to show',
    none: 'No note',
    other: (identity, role) => `${identity}: ${role}`,
    addForSelf: 'Add a note for yourself',
    addFor: (number) => `Add a note for #${number}`,
    addForCenter: (letter) => `Add a note for center card ${letter}`,
    markAs: (role) => `Mark as ${role}`,
    clear: 'Clear note',
    text: 'Notes',
    listTitle: 'My notes',
  },

  card: {
    art: (name) => `${name} card`,
  },

  errors: {
    not_member: "You're not in this room",
    not_host: 'Only the host can do that',
    not_playing: "You're not playing this game",
    wrong_phase: "You can't do that right now",
    room_full: 'Every seat is taken',
    seat_taken: 'Someone is already in that seat',
    too_few_seats: "The room can't have fewer seats than people in it",
    game_in_progress: 'A game is in progress. Come back when it ends.',
    player_count: 'Fill every seat to start',
    players_offline: "Someone isn't online",
    deck_size: 'You need 3 more cards than players',
    too_many_copies: 'Too many copies of a role',
    unknown_player: 'No such player',
    cannot_kick_self: "You can't remove yourself",
    not_your_turn: "It's not your turn yet",
    already_acted: "You've already acted this step",
    bad_targets: "That's not a valid pick",
    already_voted: "You've already voted",
    bad_message: 'Malformed message',
    bad_token: 'Your session expired. Go back home and join again.',
    room_not_found: "This room doesn't exist or has closed",
    removed: "You've left this room",
    internal: 'Something went wrong on the server',
  },

  teams: {
    village: {
      name: 'Village team',
      short: 'Village',
      goal: 'Wins if at least one werewolf is voted out. If every werewolf is in the center, wins only if nobody is out.',
    },
    werewolf: {
      name: 'Werewolf team',
      short: 'Wolves',
      goal: "Wins if no werewolf is voted out, but not if the Tanner is.",
    },
    tanner: {
      name: 'Tanner',
      short: 'Tanner',
      goal: 'Wins only by being voted out.',
    },
  },

  roles: {
    copycat: {
      name: 'Copycat',
      teamNote: 'Joins the team of the role it copies',
      summary: 'Look at 1 center card and become that role',
      ability:
        "Wakes first, looks at one center card and becomes that role (gaining its ability while keeping the Copycat card), then wakes again with that role later in the night.",
      notes: [
        "The Copycat is on the same team as the role it copied.",
        'If it copies the Doppelgänger, it wakes in the Doppelgänger step and follows the Doppelgänger rules.',
        "If time runs out, a card is picked for you at random.",
      ],
      promptHint: () => 'Flip 1 center card; you become that role (required)',
    },
    doppelganger: {
      // 软连字符：地方窄时断成 Doppel-gänger 两行
      name: 'Doppel\u00ADgänger',
      teamNote: 'Joins the team of the role it copies',
      summary: "Look at 1 player's card and become that role",
      ability:
        "Wakes after the Copycat and before everyone else, looks at another player's card and becomes that role (gaining its ability while keeping the Doppelgänger card). If it sees the Werewolf, Minion, Mason or Insomniac, it wakes with them later; for any other role with an ability, it acts right away.",
      notes: [
        'The Doppelgänger is on the same team as the role it copied.',
        'As a Werewolf, it wakes with the other werewolves.',
        "As the Robber, if it takes a Werewolf card it doesn't wake with the werewolves.",
        "As the Copycat, it can't copy again, but it wins like the Copycat.",
      ],
      promptHint: () => "Look at 1 other player's card; you become that role (required)",
    },
    werewolf: {
      name: 'Werewolf',
      summary: 'Find each other; a lone werewolf looks at 1 center card',
      ability: 'Wakes with the other werewolves to see each other. A lone werewolf must look at one center card; if time runs out, one is picked at random.',
      promptHint: () => "You're the only werewolf. Flip 1 center card (required).",
    },
    minion: {
      name: 'Minion',
      summary: 'Knows the werewolves and helps them win',
      ability:
        "Sees who the werewolves are, but they don't know the Minion. Wins if no werewolf is voted out, even if the Minion is.",
      notes: ['If every werewolf is in the center, the Minion wins as long as someone else is voted out.'],
    },
    mason: {
      name: 'Mason',
      summary: 'Two Masons find each other; add them as a pair',
      ability: 'Wakes with the other Mason to see each other.',
      notes: ["If you see no other Mason, the other card is in the center."],
    },
    seer: {
      name: 'Seer',
      summary: "Look at 1 player's card or 2 center cards",
      ability: "May look at another player's card or at two center cards.",
      promptHint: (prompt) =>
        prompt.options.some((option) => option.kind === 'player')
          ? "Look at 1 other player's card, or flip 2 center cards one at a time"
          : 'Flip 1 more center card (required)',
    },
    robber: {
      name: 'Robber',
      summary: 'Swap with 1 player, then look at the new card',
      ability:
        "Swaps cards with another player, then looks at the card taken. If time runs out, someone is robbed at random.",
      notes: ["The new card decides the Robber's team. The robbed player gets the Robber card without knowing."],
    },
    witch: {
      name: 'Witch',
      summary: 'Look at 1 center card, then give it to anyone',
      ability:
        "May look at one center card. If she does, she must swap it with any player's card, her own included.",
      notes: [
        "Swapping with yourself makes you that role; a player you swap with doesn't know.",
        "If you look but time runs out before you swap, a player is picked for you at random.",
      ],
      promptHint: (prompt) =>
        prompt.options[0]?.kind === 'center'
          ? 'You may flip 1 center card; if you do, you must give it to a player (yourself included)'
          : 'Give the card you just saw to a player, yourself included (required)',
    },
    troublemaker: {
      name: 'Trouble\u00ADmaker',
      summary: "Swap 2 other players' cards without looking",
      ability: "May swap the cards of two other players without looking at them.",
      notes: ["Neither player knows their card has changed."],
    },
    village_idiot: {
      name: 'Village Idiot',
      summary: "Shift everyone else's card one seat",
      ability: "May move every other player's card one seat over, all to the next seat or all to the previous one. You don't look at them.",
      notes: ["You're skipped: as seat 2 passing to the next seat, seat 1's card goes to seat 3, seat 3's to seat 4, and the last player's to seat 1."],
      promptHint: () => "Pass everyone else's card to the next or previous seat",
    },
    drunk: {
      name: 'Drunk',
      summary: 'Swap with 1 center card without looking',
      ability: 'Must swap their card with a center card without looking at the new one.',
      notes: ['If time runs out, a card is picked for you at random.'],
    },
    insomniac: {
      name: 'Insomniac',
      summary: 'Wakes last and checks their own card',
      ability: 'Wakes last and looks at the card they now hold.',
    },
    revealer: {
      name: 'Revealer',
      summary: 'Flip 1 card; villagers stay face up',
      ability: "Wakes last and may flip over another player's card. A village team card stays face up for everyone to see; a werewolf team card or the Tanner goes back face down, and only you know it.",
      notes: ['A Copycat or Doppelgänger card counts as the role it became.'],
      promptHint: () => "Flip 1 other player's card; village cards stay face up",
    },
    hunter: {
      name: 'Hunter',
      summary: 'If voted out, takes their vote target too',
      ability: 'If the Hunter is voted out, the player the Hunter voted for is out too.',
      notes: ['If that player is also a Hunter, their vote target is out as well.'],
    },
    tanner: {
      name: 'Tanner',
      summary: 'Wins only by being voted out',
      ability: 'Wins only if voted out.',
      notes: ["If the Tanner is voted out, the werewolf team can't win."],
    },
    villager: {
      name: 'Villager',
      summary: 'No ability; wins by reasoning',
      ability: 'Has no night ability and must reason out the werewolves.',
    },
  },
}
