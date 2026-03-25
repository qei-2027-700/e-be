"use client";

import { CheckSquare } from "lucide-react";

type Output = { title: string; todos: string[]; createdAt: string };
type Props = { output: Output };

export function WritePlanResult({ output }: Props) {
  return (
    <div className="w-full rounded-2xl rounded-tl-sm border border-primary/20 bg-primary/5 px-3 py-2.5 text-sm">
      <div className="mb-2 flex items-center gap-1.5 font-medium text-primary">
        <CheckSquare className="size-3.5" />
        <span>{output.title}</span>
      </div>
      <ol className="list-none space-y-1">
        {output.todos.map((todo, j) => (
          <li
            key={j}
            className="flex items-start gap-1.5 text-xs text-muted-foreground"
          >
            <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border border-muted-foreground/30 text-[10px]">
              {j + 1}
            </span>
            {todo}
          </li>
        ))}
      </ol>
    </div>
  );
}
