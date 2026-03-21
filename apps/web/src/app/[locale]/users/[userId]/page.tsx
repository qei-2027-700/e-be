import { notFound } from 'next/navigation';
import { getTranslations, getLocale } from 'next-intl/server';
import { eq, and, isNull } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users } from '@e-be/db/schema';
import { getPublicOrganizerHistory } from '@/lib/events';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Props = {
  params: Promise<{ userId: string }>;
};

export default async function UserProfilePage({ params }: Props) {
  const { userId } = await params;
  const [t, locale] = await Promise.all([getTranslations('profile'), getLocale()]);

  const rows = await db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(and(eq(users.id, userId), isNull(users.deletedAt)))
    .limit(1);

  if (rows.length === 0) notFound();

  const profileUser = rows[0];
  const history = await getPublicOrganizerHistory(userId);

  return (
    <main className="p-4 md:p-6">
      <div className="mx-auto max-w-2xl space-y-6">
        <h1 className="text-2xl font-bold">
          {t('title', { name: profileUser.name ?? userId })}
        </h1>

        <Card>
          <CardHeader>
            <CardTitle>{t('organizer_history_title')}</CardTitle>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                {t('organizer_history_empty')}
              </p>
            ) : (
              <ul className="divide-y">
                {history.map((event) => (
                  <li key={event.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{event.title ?? '—'}</p>
                      <p className="text-xs text-muted-foreground">{event.orgName}</p>
                    </div>
                    <p className="shrink-0 text-sm text-muted-foreground">
                      {event.startAt
                        ? new Date(event.startAt).toLocaleDateString(locale, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })
                        : '—'}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
