import { getRule } from './rule.js';
import type { PlayerId, Round, Player, RevealVotesEvent } from './types.js';
import type { ModelMessage } from 'ai';

export function newFirstRound(players: readonly Player[]): Round {
  return {
    playerIds: players.map((_, i) => `id-${i + 1}` as const),
    events: [],
  };
}

export function newRound(previousRound: Round): Round {
  const { playerIds, executed } = previousRound;

  return {
    playerIds: playerIds.filter((v) => v !== executed),
    events: [],
  };
}

export function parseVote(text: string, playerSet: Set<PlayerId>): PlayerId {
  const tagMatches = [
    ...text.matchAll(/<votes?>\s*(id-\d+)\s*<\/votes?>/g),
  ].map((m) => m[1]);
  const matches =
    tagMatches.length > 0
      ? tagMatches
      : [...text.matchAll(/id-\d+/g)].map((m) => m[0]);

  if (matches.length === 0) throw new Error('投票解析失敗：未找到 PlayerId');

  const unique = new Set(matches);
  if (unique.size > 1)
    throw new Error(
      `投票解析失敗：出現多個不同的 PlayerId：${[...unique].join('、')}`,
    );

  const target = matches[0] as PlayerId;
  if (!playerSet.has(target))
    throw new Error(`投票解析失敗：未知的 PlayerId ${target}`);

  return target;
}

export function revealVotes(votes: readonly PlayerId[]): RevealVotesEvent {
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
    result,
    mostVoted,
  };
}

export function execute({
  no,
  result,
  mostVoted,
}: RevealVotesEvent): RevealVotesEvent {
  const executed =
    mostVoted.length === 1
      ? mostVoted[0]
      : mostVoted[Math.floor(Math.random() * mostVoted.length)];

  return {
    type: 'reveal-votes',
    no,
    result,
    mostVoted,
    executed,
  };
}

export function renderRoles(
  rounds: readonly Round[],
  id: PlayerId,
): ModelMessage[] {
  const roles = new (class {
    private messages: ModelMessage[] = [
      {
        role: 'system',
        content: getRule(id),
      },
    ];
    private userBuffer: string[] = [];

    private flushUserBuffer() {
      if (this.userBuffer.length > 0) {
        this.messages.push({
          role: 'user',
          content: this.userBuffer.join('\n'),
        });
        this.userBuffer.length = 0;
      }
    }

    user(content: string) {
      this.userBuffer.push(content);
    }

    assistant(content: string) {
      this.flushUserBuffer();
      this.messages.push({ role: 'assistant', content });
    }

    toMessages(): ModelMessage[] {
      this.flushUserBuffer();
      return this.messages;
    }
  })();

  for (const [i, { playerIds, events }] of rounds.entries()) {
    roles.user(`廣播：存活受驗者為${playerIds.join('、')}。`);
    roles.user(`廣播：第${i}輪開始。`);

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
          roles.user(`廣播：本輪發言階段開始。`);
          break;

        case 'speak':
          if (event.id === id) roles.assistant(event.content);
          else roles.user(`${event.id}：${event.content}`);
          break;

        case 'start-to-vote':
          roles.user(
            `廣播：本輪${event.no === undefined ? '' : `第${event.no}次`}投票階段開始，以 <vote>id-N</vote> 格式輸出你要投票淘汰的受驗者編號。`,
          );
          break;

        case 'vote':
          if (event.id === id) roles.assistant(`<vote>${event.target}</vote>`);
          break;

        case 'reveal-votes':
          roles.user(
            `廣播：本輪${event.no === undefined ? '' : `第${event.no}次`}投票結果為${[
              ...event.result,
            ]
              .map((v) => `${v[0]} ${v[1]}票`)
              .join('、')}。`,
          );
          if (event.executed) {
            if (event.mostVoted.length > 1) {
              roles.user(`廣播：出現同票，將隨機抹殺最高票者其中一人。`);
            }
            roles.user(`廣播：已抹殺${event.executed}。`);
          }
          break;

        case 'start-to-defend':
          roles.user(`廣播：本輪辯護階段開始。`);
          break;
      }
    }
  }

  return roles.toMessages();
}
