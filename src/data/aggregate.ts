import { FAR_VOTE_WEIGHT } from '@/constants/config';
import type { Comment, EventStats, FeedItem, FoodEvent, Report, Vote } from '@/types';

/** Aggregate raw votes/reports/comments for one event into display stats. */
export function computeEventStats(
  eventId: string,
  votes: Vote[],
  reports: Report[],
  comments: Pick<Comment, 'eventId'>[],
): EventStats {
  const stats: EventStats = {
    upvotes: 0,
    downvotes: 0,
    weightedScore: 0,
    reports: { real: 0, fake: 0, over: 0 },
    commentCount: 0,
  };
  for (const v of votes) {
    if (v.eventId !== eventId) continue;
    if (v.value === 1) stats.upvotes++;
    else stats.downvotes++;
    stats.weightedScore += v.value * (v.nearby ? 1 : FAR_VOTE_WEIGHT);
  }
  for (const r of reports) {
    if (r.eventId === eventId) stats.reports[r.kind]++;
  }
  for (const c of comments) {
    if (c.eventId === eventId) stats.commentCount++;
  }
  return stats;
}

export function buildFeedItem(
  event: FoodEvent,
  viewerId: string,
  data: {
    votes: Vote[];
    reports: Report[];
    comments: Pick<Comment, 'eventId'>[];
    saves: { eventId: string; userId: string }[];
  },
): FeedItem {
  const myVote = data.votes.find((v) => v.eventId === event.id && v.userId === viewerId);
  return {
    event,
    stats: computeEventStats(event.id, data.votes, data.reports, data.comments),
    viewer: {
      vote: myVote?.value ?? null,
      reports: data.reports
        .filter((r) => r.eventId === event.id && r.userId === viewerId)
        .map((r) => r.kind),
      saved: data.saves.some((s) => s.eventId === event.id && s.userId === viewerId),
    },
  };
}
