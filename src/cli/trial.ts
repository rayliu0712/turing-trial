import { generateText, streamText } from 'ai';
import type { GameEvent, Player, PlayerId, Round } from '../core/types.js';
import {
  execute,
  newFirstRound,
  newRound,
  parseVote,
  renderRoles,
  revealVotes,
} from '../core/game.js';
import { stdout } from 'node:process';
import { styleText, type InspectColor } from 'node:util';
import { writeFile } from 'node:fs/promises';

function log(format: readonly InspectColor[], text: string) {
  stdout.write(`${styleText(format, ` ${text} `)}\n\n`);
}

export class Trial {
  private readonly rounds: Round[] = [];
  private readonly playerMap: Map<PlayerId, Player>;
  private get round() {
    return this.rounds[this.rounds.length - 1];
  }
  private get playerIds() {
    return this.round.playerIds;
  }

  private readonly doubleVote: boolean;

  constructor({
    players,
    doubleVote,
  }: {
    players: readonly Player[];
    doubleVote: boolean;
  }) {
    this.doubleVote = doubleVote;
    this.rounds.push(newFirstRound(players));
    this.playerMap = new Map(players.map((v, i) => [`id-${i + 1}`, v]));
  }

  private pushEvent(event: GameEvent) {
    this.round.events.push(event);
  }

  private nameTag(id: PlayerId): string {
    const { name } = this.playerMap.get(id)!;
    return `${name} (${id})`;
  }

  async loop() {
    for (
      let i = 1;
      this.playerIds.length > 2;
      this.rounds.push(newRound(this.round)), i++
    ) {
      this.pushEvent({ type: 'start-to-speak' });
      log(['bgWhite', 'black'], `第 ${i} 輪發言階段開始`);
      for (const id of this.playerIds) {
        await this.speak(id);
      }

      if (i === 1) {
        this.pushEvent({
          type: 'broadcast',
          content: '本輪不投票，你們之中有人說謊了',
        });
        log(['bgYellow', 'black'], '本輪不投票，你們之中有人說謊了');
        continue;
      }

      if (this.doubleVote) {
        this.pushEvent({ type: 'start-to-vote', no: 1 });
        log(['bgWhite', 'red'], `第 ${i} 輪第一次投票階段開始`);

        const votes1 = await this.collectVotes();
        const event1 = revealVotes(votes1);
        this.pushEvent(event1);

        this.pushEvent({ type: 'start-to-defend' });
        log(['bgYellow', 'black'], `第 ${i} 輪辯護階段開始`);
        for (const id of event1.mostVoted) {
          await this.speak(id);
        }

        this.pushEvent({ type: 'start-to-vote', no: 2 });
        log(['bgWhite', 'red'], `第 ${i} 輪第二次投票階段開始`);
        await this.executionVote();
        continue;
      }

      this.pushEvent({ type: 'start-to-vote' });
      log(['bgWhite', 'red'], `第 ${i} 輪投票階段開始`);
      await this.executionVote();
    }
  }

  private async speak(id: PlayerId) {
    const { model } = this.playerMap.get(id)!;
    const { textStream } = streamText({
      model,
      messages: renderRoles(this.rounds, id),
    });

    let content = '';
    log(['bgCyan', 'black'], this.nameTag(id));
    for await (const part of textStream) {
      content += part;
      stdout.write(part);
    }

    this.pushEvent({ type: 'speak', id, content });
    stdout.write('\n\n');
  }

  private async vote(
    id: PlayerId,
    playerSet: Set<PlayerId>,
  ): Promise<PlayerId> {
    const { model } = this.playerMap.get(id)!;
    const { text } = await generateText({
      model,
      messages: renderRoles(this.rounds, id),
    });

    const target = parseVote(text, playerSet);

    this.pushEvent({ type: 'vote', id, target });
    stdout.write(`${this.nameTag(id)} -> ${this.nameTag(target)}\n`);
    return target;
  }

  private async collectVotes(): Promise<PlayerId[]> {
    const playerSet = new Set(this.playerIds);
    const votes = await Promise.all(
      this.playerIds.map((k) => this.vote(k, playerSet)),
    );
    stdout.write('\n');
    return votes;
  }

  private async executionVote() {
    const votes = await this.collectVotes();
    const event = execute(revealVotes(votes));
    const executed = event.executed!;

    this.pushEvent(event);
    log(['bgRed', 'white'], `已處決 ${this.nameTag(executed)}`);
    this.round.executed = executed;
  }

  async exportAsJson() {
    const data = this.rounds.map(({ events }) => events);
    const str = JSON.stringify(data, null, 2);
    await writeFile(`turing-trial-${Date.now()}.json`, str);
  }
}
