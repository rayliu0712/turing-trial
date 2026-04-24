import type { ModelMessage } from 'ai';
import type {
  GameEvent,
  Player,
  StaticPlayer,
  PlayerId,
  Round,
  VotePhase,
} from './types.js';
import { getRule } from './rule.js';
import { pushAiContent, pushUserContent } from './messages.js';

export class Game {
  private readonly playerMap: Map<PlayerId, Player>;
  private round?: Round;
  get roundIndex() {
    return this.round!.index;
  }
  get playerIds() {
    return this.round!.playerIds;
  }

  constructor(staticPlayers: readonly StaticPlayer[]) {
    this.playerMap = new Map(
      staticPlayers.map((player, i) => {
        const id: PlayerId = `id-${i + 1}`;
        const messages: ModelMessage[] = [
          {
            role: 'system',
            content: getRule(id),
          },
        ];

        return [id, { ...player, messages }];
      }),
    );
  }

  getPlayer(id: PlayerId): Player {
    return this.playerMap.get(id)!;
  }

  existPlayer(id: PlayerId): boolean {
    return this.round!.playerSet.has(id);
  }

  newRound() {
    if (this.round === undefined) {
      const playerIds = [...this.playerMap.keys()];
      this.round = {
        index: 1,
        playerIds,
        playerSet: new Set(playerIds),
        executed: [],
      };
    } else {
      const playerSet = this.round.playerSet;
      for (const id of this.round.executed) {
        playerSet.delete(id);
      }

      this.round = {
        index: this.round.index + 1,
        playerIds: [...playerSet],
        playerSet,
        executed: [],
      };
    }

    this.emit({
      type: 'broadcast',
      content: `第 ${this.roundIndex} 輪開始，存活受驗者為 ${this.playerIds.join('、')}。`,
    });
  }

  emit(event: GameEvent) {
    switch (event.type) {
      case 'broadcast':
        this.doPushUserContent({ content: `廣播：${event.content}。` });
        break;

      case 'flash':
        this.doPushAiContent({
          id: event.id,
          content: `（你腦海裡閃過一些念頭：${event.content}）`,
        });
        break;

      case 'speak': {
        const { id, content } = event;
        this.doPushAiContent({ id, content });
        this.doPushUserContent({ content: `${id}：${content}`, excepted: id });
        break;
      }

      case 'start-to-vote':
        this.doPushUserContent({
          content: `廣播：開始${votePhase(event.phase)}投票，以 <vote>id-N</vote> 格式輸出你要投票淘汰的受驗者編號。`,
        });
        break;

      case 'vote':
        this.doPushAiContent({
          id: event.id,
          content: `<vote>${event.target}</vote>`,
        });
        break;

      case 'reveal-votes':
        this.doPushUserContent({
          content: `廣播：${votePhase(event.phase)}投票結果為 ${[
            ...event.result,
          ]
            .map((v) => `${v[0]} ${v[1]}票`)
            .join('、')}。`,
        });
        break;

      case 'start-to-defend':
        this.doPushUserContent({ content: `廣播：開始辯護。` });
        break;

      case 'execute': {
        const { id } = event;
        this.doPushUserContent({ content: `廣播：已抹殺 ${id}。` });
        this.round!.executed.push(id);
        break;
      }

      case 'someone-lied':
        this.doPushUserContent({ content: `廣播：你們之中有人說謊了。` });
        break;
    }
  }

  private doPushUserContent({
    content,
    excepted,
  }: {
    content: string;
    excepted?: PlayerId;
  }) {
    for (const [id, { messages }] of this.playerMap) {
      if (id !== excepted) {
        pushUserContent(messages, content);
      }
    }
  }

  private doPushAiContent({ id, content }: { id: PlayerId; content: string }) {
    const { messages } = this.getPlayer(id);
    pushAiContent(messages, content);
  }
}

function votePhase(phase?: VotePhase): string {
  if (phase === undefined) return '';
  if (phase === 'nomination') return '提名階段';
  return '抹殺階段';
}
