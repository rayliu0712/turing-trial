import type {
  ExecuteEvent,
  PlayerId,
  RevealVotesEvent,
  VotePhase,
} from './types.js';

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
