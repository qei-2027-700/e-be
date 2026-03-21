'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { joinEvent, cancelParticipation } from '@/lib/actions/participation';

type Props = {
  eventId: string;
  myStatus: 'registered' | 'cancelled' | null;
  isFull: boolean;
  isBeforeEvent: boolean;
  joinLabel: string;
  cancelLabel: string;
  fullLabel: string;
  endedLabel: string;
  cancellingLabel: string;
  joiningLabel: string;
};

export function ParticipationButton({
  eventId,
  myStatus,
  isFull,
  isBeforeEvent,
  joinLabel,
  cancelLabel,
  fullLabel,
  endedLabel,
  cancellingLabel,
  joiningLabel,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const t = useTranslations('event_detail');

  const handleJoin = () => {
    startTransition(async () => {
      const result = await joinEvent(eventId);
      if ('error' in result) {
        const errorKey = {
          already_registered: 'toast_already_registered',
          full_capacity: 'toast_full_capacity',
          event_ended: 'toast_event_ended',
        }[result.error] ?? 'toast_error';
        toast.error(t(errorKey as Parameters<typeof t>[0]));
        return;
      }
      toast.success(t('toast_join_success'));
      router.refresh();
    });
  };

  const handleCancel = () => {
    startTransition(async () => {
      const result = await cancelParticipation(eventId);
      if ('error' in result) {
        toast.error(t('toast_error'));
        return;
      }
      toast.success(t('toast_cancel_success'));
      router.refresh();
    });
  };

  if (!isBeforeEvent) {
    return (
      <Button disabled variant="outline" className="w-full">
        {endedLabel}
      </Button>
    );
  }

  if (myStatus === 'registered') {
    return (
      <Button
        onClick={handleCancel}
        disabled={isPending}
        variant="outline"
        className="w-full border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 active:bg-red-100"
      >
        {isPending ? cancellingLabel : cancelLabel}
      </Button>
    );
  }

  if (isFull) {
    return (
      <Button disabled variant="outline" className="w-full">
        {fullLabel}
      </Button>
    );
  }

  return (
    <Button onClick={handleJoin} disabled={isPending} className="w-full">
      {isPending ? joiningLabel : joinLabel}
    </Button>
  );
}
