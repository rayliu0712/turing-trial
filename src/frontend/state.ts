import type { Round } from '../backend/types.js';

export interface State {
  mode: 'step' | 'auto';
  roundIndex: number;
  rounds: Round[];
}
