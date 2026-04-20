import { stdout } from 'node:process';
import { styleText, type InspectColor } from 'node:util';
import { generateText, streamText } from 'ai';
import type {
  PlayerId,
  VotePhase,
  RevealVotesEvent,
  TrialConfig,
} from '../core/types.js';
import { Game } from '../core/game.js';
import { execute, parseVote, revealVotes } from '../core/vote.js';

export class CliTrial {
  private readonly game: Game;
  private readonly doubleVote: boolean;
  private readonly voteMaxRetry: number;

  constructor({
    staticPlayers,
    doubleVote = true,
    voteMaxRetry = 2,
  }: TrialConfig) {
    this.doubleVote = doubleVote;
    this.voteMaxRetry = voteMaxRetry;
    this.game = new Game(staticPlayers);
  }

  async loop() {
    while (true) {
      this.game.newRound();
      if (this.game.playerIds.length <= 2) break;

      log(['bgWhite', 'black'], `第 ${this.game.roundIndex} 輪`);
      for (const id of this.game.playerIds) {
        await this.speak(id);
      }

      if (this.game.roundIndex === 1) {
        this.game.emit({
          type: 'broadcast',
          content: '本輪不投票，你們之中有人說謊了',
        });
        log(['bgYellow', 'black'], '本輪不投票，你們之中有人說謊了');
        continue;
      }

      if (this.doubleVote) {
        this.game.emit({ type: 'start-to-vote', phase: 'nomination' });
        log(['bgWhite', 'red'], `第 ${this.game.roundIndex} 輪提名階段投票`);
        const mostVoted1 = await this.collectVotes('nomination');

        this.game.emit({ type: 'start-to-defend' });
        log(['bgYellow', 'black'], `第 ${this.game.roundIndex} 輪辯護`);
        for (const id of mostVoted1) {
          await this.speak(id);
        }

        this.game.emit({ type: 'start-to-vote', phase: 'execution' });
        log(['bgWhite', 'red'], `第 ${this.game.roundIndex} 輪抹殺階段投票`);
        const mostVoted2 = await this.collectVotes('execution');
        this.doExecute(mostVoted2);
        continue;
      }

      this.game.emit({ type: 'start-to-vote' });
      log(['bgWhite', 'red'], `第 ${this.game.roundIndex} 輪投票`);
      const mostVoted = await this.collectVotes();
      this.doExecute(mostVoted);
    }
  }

  private nameTag(id: PlayerId): string {
    const { name } = this.game.getPlayer(id);
    return `${name} (${id})`;
  }

  private async speak(id: PlayerId) {
    const { model, messages } = this.game.getPlayer(id);
    const { textStream } = streamText({ model, messages });

    let content = '';
    log(['bgCyan', 'black'], this.nameTag(id));
    for await (const part of textStream) {
      content += part;
      stdout.write(part);
    }

    this.game.emit({ type: 'speak', id, content });
    stdout.write('\n\n');
  }

  private async vote(id: PlayerId): Promise<PlayerId> {
    const { model, messages } = this.game.getPlayer(id);
    const meTag = this.nameTag(id);

    for (let i = 0; i < this.voteMaxRetry; i++) {
      if (i > 0) {
        stdout.write(`${meTag} 第 ${i + 1}/${this.voteMaxRetry} 次重試\n`);
      }

      const { text } = await generateText({ model, messages });

      const target = parseVote(text);
      if (target === null || !this.game.existPlayer(target)) continue;

      this.game.emit({ type: 'vote', id, target });
      stdout.write(`${meTag} --> ${this.nameTag(target)}\n`);
      return target;
    }

    return id; // 笨模型，給我去死
  }

  private async collectVotes(phase?: VotePhase): Promise<PlayerId[]> {
    const votes = await Promise.all(
      this.game.playerIds.map((k) => this.vote(k)),
    );
    stdout.write('\n');

    const event: RevealVotesEvent = { ...revealVotes(votes), phase };
    this.game.emit(event);
    return event.mostVoted;
  }

  private doExecute(mostVoted: readonly PlayerId[]) {
    const event = execute(mostVoted);
    this.game.emit(event);
    log(['bgRed', 'white'], `抹殺 ${this.nameTag(event.id)}`);
  }
}

function log(format: readonly InspectColor[], text: string) {
  stdout.write(`${styleText(format, ` ${text} `)}\n\n`);
}
