import { getTranslations } from 'next-intl/server';
import { getDbUser } from '@/lib/auth';
import { WithdrawalSection } from './withdrawal-section';
import { ProfileSection } from './profile-section';

export default async function AccountSettingsPage() {
  const [t, dbUser] = await Promise.all([
    getTranslations('dashboard.account_settings'),
    getDbUser(),
  ]);

  return (
    <main className="container mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">{t('title')}</h1>
      <div className="space-y-6">
        <ProfileSection currentXUrl={dbUser?.xUrl ?? null} />
        <WithdrawalSection />
      </div>
    </main>
  );
}
