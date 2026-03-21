import { getTranslations } from 'next-intl/server';
import { WithdrawalSection } from './withdrawal-section';

export default async function AccountSettingsPage() {
  const t = await getTranslations('dashboard.account_settings');

  return (
    <main className="container mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">{t('title')}</h1>
      <WithdrawalSection />
    </main>
  );
}
