import { newFirstRound, newRound } from '../backend/round.js';
import type { GameEvent, Player, Round } from '../backend/types.js';
import type { State } from './state.js';
import { Widget } from './widget.js';

class Game {
  readonly rounds: Round[] = [];
  readonly state: State = {
    roundIndex: 1,
    mode: 'step',
    rounds: this.rounds,
  };
  readonly widget = new Widget(this.state);

  get currentRound() {
    return this.rounds[this.rounds.length - 1];
  }

  constructor(players: Player[]) {
    this.rounds.push(newFirstRound(players));
  }

  pushEvent(event: GameEvent) {
    this.currentRound.events.push(event);
  }

  async startLoop() {
    let i = 1;

    while (this.currentRound.playerMap.size > 2) {
      this.pushEvent({ type: 'start-to-speak' });
    }
  }
}

const game = new Game([]);
