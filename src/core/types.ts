import type { LanguageModel, ModelMessage } from 'ai';

export type PlayerId = `id-${number}`;

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
    }
  | { type: 'someone-lied' };

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

/**
 * Player & Round
 */

export interface StaticPlayer {
  model: LanguageModel;
  name: string;
}

export interface Player extends StaticPlayer {
  messages: ModelMessage[];
}

export interface Round {
  index: number;
  playerIds: PlayerId[];
  playerSet: Set<PlayerId>;
  executed: PlayerId[];
}
