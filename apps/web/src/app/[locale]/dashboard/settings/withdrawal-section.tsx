'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { checkWithdrawalAction, withdrawAction } from './actions';

type Blocker = { type: 'owner' | 'published_event'; message: string };

type Step =
  | { name: 'idle' }
  | { name: 'checking' }
  | { name: 'blocked'; blockers: Blocker[] }
  | { name: 'confirm' }
  | { name: 'processing' };

export function WithdrawalSection() {
  const t = useTranslations('dashboard.account_settings');
  const [step, setStep] = useState<Step>({ name: 'idle' });
  const [confirmText, setConfirmText] = useState('');

  const confirmKeyword = t('withdrawal_confirm_placeholder');

  async function handleWithdrawalClick() {
    setStep({ name: 'checking' });
    const result = await checkWithdrawalAction();

    if ('error' in result) {
      setStep({ name: 'idle' });
      return;
    }

    if (result.blockers.length > 0) {
      setStep({ name: 'blocked', blockers: result.blockers });
      return;
    }

    setStep({ name: 'confirm' });
  }

  async function handleConfirmSubmit() {
    if (confirmText !== confirmKeyword) return;
    setStep({ name: 'processing' });
    await withdrawAction();
  }

  return (
    <Card className="border-destructive">
      <CardHeader>
        <CardTitle className="text-destructive">{t('withdrawal_section_title')}</CardTitle>
        <CardDescription>{t('withdrawal_description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {step.name === 'idle' && (
          <Button
            variant="destructive"
            className="min-h-11 cursor-pointer"
            onClick={handleWithdrawalClick}
          >
            {t('withdrawal_button')}
          </Button>
        )}

        {step.name === 'checking' && (
          <Button variant="destructive" className="min-h-11" disabled>
            {t('withdrawal_checking')}
          </Button>
        )}

        {step.name === 'blocked' && (
          <div className="space-y-3">
            {step.blockers.map((blocker) => (
              <div
                key={blocker.type}
                className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"
              >
                <p className="font-semibold">
                  {blocker.type === 'owner'
                    ? t('blocker_owner_title')
                    : t('blocker_event_title')}
                </p>
                <p className="mt-1">
                  {blocker.type === 'owner'
                    ? t('blocker_owner_description')
                    : t('blocker_event_description')}
                </p>
              </div>
            ))}
            <Button
              variant="outline"
              className="min-h-11 cursor-pointer"
              onClick={() => setStep({ name: 'idle' })}
            >
              {t('withdrawal_confirm_cancel')}
            </Button>
          </div>
        )}

        {step.name === 'confirm' && (
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-sm font-semibold">{t('withdrawal_confirm_title')}</p>
              <p className="mb-4 text-sm text-muted-foreground">
                {t('withdrawal_confirm_description')}
              </p>
              <Label htmlFor="confirm-text" className="mb-1 block text-sm">
                {confirmKeyword}
              </Label>
              <Input
                id="confirm-text"
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={confirmKeyword}
                className="max-w-xs"
              />
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                variant="destructive"
                className="min-h-11 cursor-pointer"
                disabled={confirmText !== confirmKeyword}
                onClick={handleConfirmSubmit}
              >
                {t('withdrawal_confirm_submit')}
              </Button>
              <Button
                variant="outline"
                className="min-h-11 cursor-pointer"
                onClick={() => {
                  setConfirmText('');
                  setStep({ name: 'idle' });
                }}
              >
                {t('withdrawal_confirm_cancel')}
              </Button>
            </div>
          </div>
        )}

        {step.name === 'processing' && (
          <Button variant="destructive" className="min-h-11" disabled>
            {t('withdrawal_processing')}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
