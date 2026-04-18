import type { LanguageModel } from 'ai';

export type PlayerId = `id-${number}`;

export interface Player {
  model: LanguageModel;
  name: string;
}

export interface Round {
  playerIds: PlayerId[];
  executed: PlayerId[];
  events: GameEvent[];
}

export type VotePhase = 'nomination' | 'execution';

export type GameEvent =
  | {
      type: 'broadcast';
      content: string;
    }
  | {
      type: 'flash';
      id: PlayerId;
      content: string;
    }
  | {
      type: 'start-to-speak';
    }
  | {
      type: 'speak';
      id: PlayerId;
      content: string;
    }
  | {
      type: 'start-to-vote';
      phase?: VotePhase;
    }
  | {
      type: 'vote';
      id: PlayerId;
      target: PlayerId;
    }
  | RevealVotesEvent
  | ExecuteEvent
  | {
      type: 'start-to-defend';
    };

export interface RevealVotesEvent {
  type: 'reveal-votes';
  phase?: VotePhase;
  result: Map<PlayerId, number>;
  mostVoted: PlayerId[];
}

export interface ExecuteEvent {
  type: 'execute';
  id: PlayerId;
}
