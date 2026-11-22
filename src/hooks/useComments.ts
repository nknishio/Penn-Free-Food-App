import { useCallback, useEffect, useState } from 'react';

import { repository } from '@/data';
import { useEvents } from '@/store/events';
import { useSession } from '@/store/session';
import type { Comment } from '@/types';

/** Load and post comments for one event. */
export function useComments(eventId: string) {
  const [comments, setComments] = useState<Comment[]>([]);
  const refreshOne = useEvents((s) => s.refreshOne);

  const load = useCallback(async () => {
    setComments(await repository.listComments(eventId));
  }, [eventId]);

  useEffect(() => {
    let active = true;
    repository.listComments(eventId).then((list) => {
      if (active) setComments(list);
    });
    return () => {
      active = false;
    };
  }, [eventId]);

  const addComment = useCallback(
    async (body: string, anonymous: boolean) => {
      const user = useSession.getState().user;
      if (!user || !body.trim()) return;
      await repository.addComment({
        eventId,
        authorId: user.id,
        authorName: anonymous ? 'Anonymous' : user.name,
        anonymous,
        body: body.trim(),
      });
      await Promise.all([load(), refreshOne(eventId)]);
    },
    [eventId, load, refreshOne],
  );

  return { comments, addComment };
}
