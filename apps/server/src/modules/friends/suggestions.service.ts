import { Injectable, Logger } from '@nestjs/common';
import { FriendsRepository } from './friends.repository';
import { RedisService } from '../../common/redis.service';
import {
  FriendSuggestion,
  SUGGESTION_FINAL_LIMIT,
  SUGGESTION_RANK_WINDOW,
  SUGGESTION_RECENT_OPPONENTS_LIMIT,
  friendSuggestionsCacheKey,
  FRIEND_SUGGESTIONS_CACHE_TTL,
} from './types';

@Injectable()
export class SuggestionsService {
  private readonly logger = new Logger(SuggestionsService.name);

  constructor(
    private readonly repo: FriendsRepository,
    private readonly redis: RedisService,
  ) {}

  async getSuggestions(viewerId: string): Promise<FriendSuggestion[]> {
    const cacheKey = friendSuggestionsCacheKey(viewerId);
    const cached = await this.redis.get<FriendSuggestion[]>(cacheKey);
    if (cached) return cached;

    const viewer = await this.repo.findUserById(viewerId);
    if (!viewer) return [];

    const excludedUserIds = await this.repo.getExcludedUserIdsForSuggestions(viewerId);

    const rankCandidateIds = await this.repo.findUserIdsNearRank(
      viewerId,
      viewer.rank,
      SUGGESTION_RANK_WINDOW,
      SUGGESTION_RECENT_OPPONENTS_LIMIT,
    );

    const opponentIds = await this.repo.findRecentOpponentIds(
      viewerId,
      SUGGESTION_RECENT_OPPONENTS_LIMIT,
    );

    const ranked: Map<
      string,
      { reason: 'RANK_PROXIMITY' | 'RECENT_OPPONENT' }
    > = new Map();

    for (const id of rankCandidateIds) {
      if (excludedUserIds.has(id)) continue;
      ranked.set(id, { reason: 'RANK_PROXIMITY' });
    }
    for (const id of opponentIds) {
      if (excludedUserIds.has(id)) continue;
      if (!ranked.has(id)) {
        ranked.set(id, { reason: 'RECENT_OPPONENT' });
      }
    }

    const allCandidateIds = Array.from(ranked.keys());
    if (allCandidateIds.length === 0) {
      await this.redis.set(cacheKey, [], FRIEND_SUGGESTIONS_CACHE_TTL);
      return [];
    }

    const users = await this.repo.findUsersByIds(allCandidateIds);
    const userMap = new Map(users.map((u) => [u.id, u]));

    const suggestions: FriendSuggestion[] = [];
    for (const id of allCandidateIds) {
      const user = userMap.get(id);
      const meta = ranked.get(id);
      if (!user || !meta) continue;
      const mutualFriends = await this.repo.countMutualFriends(viewerId, id);
      suggestions.push({
        id: user.id,
        username: user.username,
        avatarUrl: user.avatarUrl,
        rank: user.rank,
        reason: meta.reason,
        mutualFriends,
      });
    }

    suggestions.sort((a, b) => {
      if (b.mutualFriends !== a.mutualFriends) {
        return b.mutualFriends - a.mutualFriends;
      }
      return b.rank - a.rank;
    });

    const final = suggestions.slice(0, SUGGESTION_FINAL_LIMIT);
    await this.redis.set(cacheKey, final, FRIEND_SUGGESTIONS_CACHE_TTL);
    return final;
  }



  async invalidate(userId: string): Promise<void> {
    await this.redis.del(friendSuggestionsCacheKey(userId));
  }
}
