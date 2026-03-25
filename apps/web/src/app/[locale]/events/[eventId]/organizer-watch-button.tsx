"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { toggleWatchUser } from "@/lib/actions/watch";

type Props = {
  targetUserId: string;
  initialWatching: boolean;
  watchLabel: string;
  unwatchLabel: string;
  watchSuccess: string;
  unwatchSuccess: string;
  errorLabel: string;
  onChange?: (watching: boolean) => void;
};

export function OrganizerWatchButton({
  targetUserId,
  initialWatching,
  watchLabel,
  unwatchLabel,
  watchSuccess,
  unwatchSuccess,
  errorLabel,
  onChange,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [watching, setWatching] = useState(initialWatching);
  const label = watching ? unwatchLabel : watchLabel;

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="cursor-pointer"
      disabled={isPending}
      aria-label={label}
      onClick={() => {
        startTransition(async () => {
          const result = await toggleWatchUser(targetUserId);
          if ("error" in result) {
            toast.error(errorLabel);
            return;
          }
          setWatching(result.watching);
          toast.success(result.watching ? watchSuccess : unwatchSuccess);
          onChange?.(result.watching);
        });
      }}
    >
      <Heart className={watching ? "h-5 w-5 fill-current" : "h-5 w-5"} />
    </Button>
  );
}
