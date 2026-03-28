'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, LayoutDashboard, Settings, LogOut, Shield, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { signOutAction } from '@/lib/actions/auth';
import { useTranslations } from 'next-intl';
import { APP_NAME } from '@/lib/config';

interface HamburgerMenuProps {
  locale: string;
  userType: 'user' | 'venue_user' | 'system_user';
  unreadCount?: number;
}

export function HamburgerMenu({ locale, userType, unreadCount = 0 }: HamburgerMenuProps) {
  const [open, setOpen] = useState(false);
  const t = useTranslations('dashboard.nav');

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden cursor-pointer"
        onClick={() => setOpen(true)}
        aria-label="メニューを開く"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-64">
          <SheetHeader>
            <SheetTitle>{APP_NAME}</SheetTitle>
          </SheetHeader>
          <nav className="mt-6 flex flex-col gap-1">
            <Link
              href={`/${locale}/dashboard`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-lg px-3 py-3 min-h-11 text-sm font-medium transition-colors hover:bg-muted cursor-pointer"
            >
              <LayoutDashboard className="h-4 w-4" />
              {t('dashboard')}
            </Link>
            <Link
              href={`/${locale}/dashboard/notifications`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-lg px-3 py-3 min-h-11 text-sm font-medium transition-colors hover:bg-muted cursor-pointer"
            >
              <Bell className="h-4 w-4" />
              {t('notifications')}
              {unreadCount > 0 && (
                <span className="ml-auto rounded-full bg-destructive px-1.5 py-0.5 text-[10px] font-bold text-destructive-foreground">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Link>
            <Link
              href={`/${locale}/dashboard/settings`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-lg px-3 py-3 min-h-11 text-sm font-medium transition-colors hover:bg-muted cursor-pointer"
            >
              <Settings className="h-4 w-4" />
              {t('account_settings')}
            </Link>
            {userType === 'system_user' && (
              <Link
                href={`/${locale}/admin`}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-3 min-h-11 text-sm font-medium transition-colors hover:bg-muted cursor-pointer"
              >
                <Shield className="h-4 w-4" />
                {t('admin')}
              </Link>
            )}
            <div className="mt-2 border-t pt-2">
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-3 min-h-11 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  {t('sign_out')}
                </button>
              </form>
            </div>
          </nav>
        </SheetContent>
      </Sheet>
    </>
  );
}
