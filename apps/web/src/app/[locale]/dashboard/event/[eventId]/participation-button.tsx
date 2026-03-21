'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
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

  const handleJoin = () => {
    startTransition(async () => {
      await joinEvent(eventId);
      router.refresh();
    });
  };

  const handleCancel = () => {
    startTransition(async () => {
      await cancelParticipation(eventId);
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
