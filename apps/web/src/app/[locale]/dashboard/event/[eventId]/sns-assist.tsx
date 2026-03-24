"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { generateSnsContent } from "@/lib/actions/sns-assist";

interface Props {
  eventId: string;
}

export function SnsAssist({ eventId }: Props) {
  const t = useTranslations("event_detail");
  const [isLoading, setIsLoading] = useState(false);
  const [xPost, setXPost] = useState<string | null>(null);
  const [imagePrompt, setImagePrompt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  async function handleGenerate() {
    setIsLoading(true);
    setError(null);
    const result = await generateSnsContent(eventId);
    if (result.ok) {
      setXPost(result.data.xPost);
      setImagePrompt(result.data.imagePrompt);
    } else {
      setError(t("sns_assist_error"));
    }
    setIsLoading(false);
  }

  async function handleCopy(text: string, key: string) {
    await navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{t("sns_assist_title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5 sm:space-y-6">
        <Button onClick={handleGenerate} disabled={isLoading} className="w-full sm:w-auto">
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              {t("sns_assist_generating")}
            </span>
          ) : (
            t("sns_assist_generate")
          )}
        </Button>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        {xPost && (
          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              {t("sns_assist_x_post")}
            </p>
            <div className="min-h-32 rounded-md border bg-muted/40 p-4 text-base leading-relaxed whitespace-pre-wrap">
              {xPost}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCopy(xPost, "xPost")}
            >
              {copiedKey === "xPost" ? t("sns_assist_copied") : t("sns_assist_copy")}
            </Button>
          </div>
        )}

        {imagePrompt && (
          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              {t("sns_assist_image_prompt")}
            </p>
            <div className="min-h-32 rounded-md border bg-muted/40 p-4 text-sm leading-relaxed whitespace-pre-wrap font-mono">
              {imagePrompt}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCopy(imagePrompt, "imagePrompt")}
            >
              {copiedKey === "imagePrompt" ? t("sns_assist_copied") : t("sns_assist_copy")}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
