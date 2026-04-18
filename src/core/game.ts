import type { ModelMessage } from 'ai';
import type {
  ExecuteEvent,
  GameEvent,
  Player,
  PlayerId,
  RevealVotesEvent,
  Round,
  VotePhase,
} from './types.js';
import { Roles } from './roles.js';
import { getRule } from './rule.js';

export class Game {
  private readonly playerMap: Map<PlayerId, Player>;
  private readonly rounds: Round[] = [];

  constructor(players: readonly Player[]) {
    this.playerMap = new Map(players.map((v, i) => [`id-${i + 1}`, v]));
  }

  getPlayer(id: PlayerId): Player {
    return this.playerMap.get(id)!;
  }

  private get round() {
    return this.rounds[this.rounds.length - 1];
  }

  get playerIds() {
    return this.round.playerIds;
  }

  newRound() {
    if (this.rounds.length === 0) {
      this.rounds.push({
        playerIds: [...this.playerMap.keys()],
        executed: [],
        events: [],
      });
      return;
    }

    const set = new Set(this.round.playerIds);
    for (const id of this.round.executed) {
      set.delete(id);
    }
    this.rounds.push({
      playerIds: [...set],
      executed: [],
      events: [],
    });
  }

  newEvent(event: GameEvent) {
    if (event.type === 'execute') {
      this.round.executed.push(event.id);
    }
    this.round.events.push(event);
  }

  renderRoles(id: PlayerId): ModelMessage[] {
    const roles = new Roles();

    for (const [i, { playerIds, events }] of this.rounds.entries()) {
      roles.user(`廣播：存活受驗者為 ${playerIds.join('、')}。`);
      roles.user(`廣播：第 ${i + 1} 輪開始。`);

      for (const event of events) {
        switch (event.type) {
          case 'broadcast':
            roles.user(`廣播：${event.content}。`);
            break;

          case 'flash':
            if (event.id === id)
              roles.user(`（你腦海裡閃過一些念頭：${event.content}）`);
            break;

          case 'start-to-speak':
            roles.user(`廣播：開始發言。`);
            break;

          case 'speak':
            if (event.id === id) roles.assistant(event.content);
            else roles.user(`${event.id}：${event.content}`);
            break;

          case 'start-to-vote':
            roles.user(
              `廣播：開始${votePhase(event.phase)}投票，以 <vote>id-N</vote> 格式輸出你要投票淘汰的受驗者編號。`,
            );
            break;

          case 'vote':
            if (event.id === id)
              roles.assistant(`<vote>${event.target}</vote>`);
            break;

          case 'reveal-votes':
            roles.user(
              `廣播：${votePhase(event.phase)}投票結果為${[...event.result]
                .map((v) => `${v[0]} ${v[1]}票`)
                .join('、')}。`,
            );
            break;

          case 'execute':
            roles.user(`廣播：已抹殺 ${event.id}。`);
            break;

          case 'start-to-defend':
            roles.user(`廣播：開始辯護。`);
            break;
        }
      }
    }

    return [
      {
        role: 'system',
        content: getRule(id),
      },
      ...roles.toMessages(),
    ];
  }

  parseVote(text: string): PlayerId | null {
    const tagMatches = [
      ...text.matchAll(/<votes?>\s*(id-\d+)\s*<\/votes?>/g),
    ].map((m) => m[1]);

    const matches =
      tagMatches.length > 0
        ? tagMatches
        : [...text.matchAll(/id-\d+/g)].map((m) => m[0]);

    if (matches.length === 0) return null;

    const unique = new Set(matches);
    if (unique.size > 1) return null;

    const target = matches[0] as PlayerId;
    return this.round.playerIds.find((v) => v === target) ? target : null;
  }

  toMarkdown(): string {
    const lines: string[] = [];
    const nameTag = (id: PlayerId) => {
      const { name } = this.playerMap.get(id)!;
      return `${name} (${id})`;
    };

    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

    lines.push(`**產生時間：** ${timestamp}`);
    lines.push('');
    lines.push('**玩家：**');
    lines.push('');
    for (const [id, { name }] of this.playerMap) {
      lines.push(`- ${nameTag(id)}`);
    }
    lines.push('');

    for (const [i, { playerIds, events }] of this.rounds.entries()) {
      lines.push(`# 第 ${i + 1} 輪`);
      lines.push('');
      lines.push(`**存活受驗者：** ${playerIds.map(nameTag).join('、')}`);
      lines.push('');

      for (const event of events) {
        switch (event.type) {
          case 'broadcast':
            lines.push(`> 📢 ${event.content}`);
            lines.push('');
            break;

          case 'flash':
            lines.push(
              `*💭 ${nameTag(event.id)} 腦海中閃過念頭：${event.content}*`,
            );
            lines.push('');
            break;

          case 'start-to-speak':
            lines.push('---');
            lines.push('');
            lines.push('### 發言階段');
            lines.push('');
            break;

          case 'speak': {
            lines.push(
              `> ${nameTag(event.id)}：${event.content.split('\n').join('\n> ')}`,
            );
            lines.push('');
            break;
          }

          case 'start-to-vote':
            lines.push('---');
            lines.push('');
            lines.push(`### ${votePhase(event.phase)}投票階段`);
            lines.push('');
            break;

          case 'vote':
            lines.push(`- ${nameTag(event.id)} → ${nameTag(event.target)}`);
            break;

          case 'reveal-votes': {
            const entries = [...event.result];
            lines.push('');
            lines.push(
              `> 投票結果：${entries.map(([id, count]) => `${nameTag(id)} ${count} 票`).join('、')}`,
            );
            lines.push('');
            break;
          }

          case 'execute':
            lines.push(`> 💀 已抹殺 **${nameTag(event.id)}**`);
            lines.push('');
            break;

          case 'start-to-defend':
            lines.push('---');
            lines.push('');
            lines.push('### 辯護階段');
            lines.push('');
            break;
        }
      }
    }

    return lines.join('\n');
  }
}

function votePhase(phase?: VotePhase): string {
  if (phase === undefined) return '';
  if (phase === 'nomination') return '提名階段';
  return '處決階段';
}

export function revealVotes(
  votes: readonly PlayerId[],
  phase?: VotePhase,
): RevealVotesEvent {
  const result = new Map<PlayerId, number>();

  for (const id of votes) {
    result.set(id, (result.get(id) ?? 0) + 1);
  }

  // 票數降序排序，當同票時以 playerId 升序排序
  const sorted = [...result].toSorted(
    (a, b) => b[1] - a[1] || parseInt(a[0].slice(3)) - parseInt(b[0].slice(3)),
  );

  const maxVotes = sorted[0][1];
  const mostVoted = [sorted[0][0]];

  for (let i = 1; i < sorted.length; i++) {
    const [id, received] = sorted[i];
    if (received < maxVotes) break;
    mostVoted.push(id);
  }

  return {
    type: 'reveal-votes',
    phase,
    result,
    mostVoted,
  };
}

export function execute(mostVoted: readonly PlayerId[]): ExecuteEvent {
  const id =
    mostVoted.length === 1
      ? mostVoted[0]
      : mostVoted[Math.floor(Math.random() * mostVoted.length)];

  return {
    type: 'execute',
    id,
  };
}
