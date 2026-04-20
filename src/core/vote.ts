import type { ExecuteEvent, PlayerId, RevealVotesEvent } from './types.js';

export function parseVote(text: string): PlayerId | null {
  const tagMatch = text.match(/<votes?>\s*(id-\d+)\s*<\/votes?>/);
  if (tagMatch) {
    return tagMatch[1] as PlayerId;
  }

  const textMatch = text.match(/id-\d+/);
  if (textMatch) {
    return textMatch[0] as PlayerId;
  }

  return null;
}

export function revealVotes(votes: readonly PlayerId[]): RevealVotesEvent {
  const result = new Map<PlayerId, number>();

  for (const id of votes) {
    result.set(id, (result.get(id) ?? 0) + 1);
  }

  // 票數降序排序，當同票時以 playerId 升序排序
  const sorted = [...result].toSorted((a, b) => {
    const votes = b[1] - a[1];
    if (votes != 0) return votes;
    return parseInt(a[0].slice(3)) - parseInt(b[0].slice(3));
  });

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
