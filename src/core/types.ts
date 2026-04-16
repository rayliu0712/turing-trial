import type { LanguageModel } from 'ai';

export type PlayerId = `id-${number}`;

export interface Player {
  model: LanguageModel;
  name: string;
}

export interface Round {
  playerIds: PlayerId[];
  events: GameEvent[];
  executed?: PlayerId;
}

export interface RevealVotesEvent {
  type: 'reveal-votes';
  no?: number;
  result: Map<PlayerId, number>;
  mostVoted: PlayerId[];
  executed?: PlayerId;
}

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
      no?: number;
    }
  | {
      type: 'vote';
      id: PlayerId;
      target: PlayerId;
    }
  | RevealVotesEvent
  | {
      type: 'start-to-defend';
    };
