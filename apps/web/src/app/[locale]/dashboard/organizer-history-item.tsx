'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toggleEventPublicAction } from './organizer-history-actions';

type Props = {
  event: {
    id: string;
    title: string | null;
    startAt: string | null;
    status: string;
    orgName: string;
    isPublic: boolean;
    chargeAmount: number | null;
    participantCount: number;
  };
  locale: string;
};

export function OrganizerHistoryItem({ event, locale }: Props) {
  const t = useTranslations('dashboard');
  const [isPublic, setIsPublic] = useState(event.isPublic);
  const [isPending, startTransition] = useTransition();

  const isCompleted = event.status === 'published';

  const statusKey =
    event.status === 'cancelled'
      ? 'event_status_cancelled'
      : event.status === 'rejected'
        ? 'event_status_rejected'
        : 'event_status_published_ended';

  const handleToggle = (checked: boolean) => {
    setIsPublic(checked);
    startTransition(async () => {
      const result = await toggleEventPublicAction(event.id, checked);
      if (result.error) {
        // 失敗時は元に戻す
        setIsPublic(!checked);
      }
    });
  };

  const salesAmount =
    event.chargeAmount != null ? event.chargeAmount * event.participantCount : null;

  return (
    <li className="py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium">{event.title ?? '—'}</p>
          <p className="text-xs text-muted-foreground">{event.orgName}</p>
          <p className="text-xs text-muted-foreground">
            {event.startAt
              ? new Date(event.startAt).toLocaleDateString(locale, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })
              : '—'}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {isCompleted && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">
                {isPublic ? t('organizer_history_public') : t('organizer_history_private')}
              </span>
              <Switch
                checked={isPublic}
                onCheckedChange={handleToggle}
                disabled={isPending}
                aria-label={isPublic ? t('organizer_history_toggle_private') : t('organizer_history_toggle_public')}
              />
            </div>
          )}
          <Badge
            variant={
              event.status === 'cancelled' || event.status === 'rejected'
                ? 'secondary'
                : 'outline'
            }
          >
            {t(statusKey)}
          </Badge>
        </div>
      </div>
      <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
        <span className="text-xs text-muted-foreground">
          {t('organizer_history_participants')}:{' '}
          <span className="font-medium text-foreground">{event.participantCount}</span>
        </span>
        <span className="text-xs text-muted-foreground">
          {t('organizer_history_charge')}:{' '}
          <span className="font-medium text-foreground">
            {event.chargeAmount != null
              ? `¥${event.chargeAmount.toLocaleString(locale)}`
              : '—'}
          </span>
        </span>
        <span className="text-xs text-muted-foreground">
          {t('organizer_history_sales')}:{' '}
          <span className="font-medium text-foreground">
            {salesAmount != null ? `¥${salesAmount.toLocaleString(locale)}` : '—'}
          </span>
        </span>
      </div>
    </li>
  );
}
