import { describe, it, expect, vi, beforeEach } from 'vitest';

// モック設定
vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(),
    update: vi.fn(),
    insert: vi.fn(),
  },
}));

vi.mock('@/lib/auth', () => ({
  getDbUser: vi.fn(),
  getUser: vi.fn(),
  getUserType: vi.fn(),
}));

vi.mock('@/lib/events', () => ({
  checkEventConflict: vi.fn(),
  hasBarHostPermission: vi.fn(),
}));

vi.mock('@/lib/notify', () => ({
  sendNotification: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@e-be/db', () => ({
  NOTIFICATION_TYPES: {
    PARTICIPATION_RECEIVED: 'participation_received',
    WATCHED_ORGANIZER_EVENT_PUBLISHED: 'watched_organizer_event_published',
  },
}));

import { db } from '@/lib/db';
import { getDbUser } from '@/lib/auth';
import { updateEventDraft, submitEvent, publishEvent } from '../event';

// Drizzle クエリチェーンを組み立てるヘルパー
function makeSelectChain(resolvedValue: unknown[]) {
  const limit = vi.fn().mockResolvedValue(resolvedValue);
  const where = vi.fn().mockReturnValue({ limit });
  const from = vi.fn().mockReturnValue({ where });
  return { from, where, limit };
}

function makeSelectWhereResolved(resolvedValue: unknown[]) {
  const where = vi.fn().mockResolvedValue(resolvedValue);
  const from = vi.fn().mockReturnValue({ where });
  return { from, where };
}

function makeUpdateChain() {
  const where = vi.fn().mockResolvedValue(undefined);
  const set = vi.fn().mockReturnValue({ where });
  return { set, where };
}

// テスト用のユーザーIDとイベントID
const USER_A = 'user-aaaa-0000-0000-000000000001';
const USER_B = 'user-bbbb-0000-0000-000000000002';
const EVENT_OWNED_BY_B = 'event-bbbb-0000-0000-000000000001';

describe('イベント管理 Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ====================================================
  // テスト 1: 他人のイベントを管理できないこと
  // ====================================================
  describe('updateEventDraft — 他人のイベントを変更できないこと', () => {
    it('userA が userB のイベントを更新しようとすると not_found を返す', async () => {
      // userA としてログイン
      vi.mocked(getDbUser).mockResolvedValue({ id: USER_A } as never);

      // db.select で空配列を返す（userId が一致しないためレコードなし）
      const chain = makeSelectChain([]);
      vi.mocked(db.select).mockReturnValue({ from: chain.from } as never);

      const formData = new FormData();
      formData.set('title', '悪意のある更新');
      formData.set('description', '他人のイベントを乗っ取ろうとしている');

      const result = await updateEventDraft(EVENT_OWNED_BY_B, formData);

      expect(result).toEqual({ error: 'not_found' });
      // DB更新が呼ばれていないことを確認
      expect(db.update).not.toHaveBeenCalled();
    });
  });

  describe('submitEvent — 他人のイベントを申請できないこと', () => {
    it('userA が userB のイベントを申請しようとすると not_found を返す', async () => {
      vi.mocked(getDbUser).mockResolvedValue({ id: USER_A } as never);

      const chain = makeSelectChain([]);
      vi.mocked(db.select).mockReturnValue({ from: chain.from } as never);

      const result = await submitEvent(EVENT_OWNED_BY_B);

      expect(result).toEqual({ error: 'not_found' });
      expect(db.update).not.toHaveBeenCalled();
    });
  });

  describe('publishEvent — 他人のイベントを公開できないこと', () => {
    it('userA が userB のイベントを公開しようとすると not_found を返す', async () => {
      vi.mocked(getDbUser).mockResolvedValue({ id: USER_A } as never);

      const chain = makeSelectChain([]);
      vi.mocked(db.select).mockReturnValue({ from: chain.from } as never);

      const result = await publishEvent(EVENT_OWNED_BY_B);

      expect(result).toEqual({ error: 'not_found' });
      expect(db.update).not.toHaveBeenCalled();
    });
  });

  describe('publishEvent — watch 中のユーザーへ通知が作成されること', () => {
    it('公開に成功すると watcher に sendNotification が呼ばれる', async () => {
      const MY_EVENT = 'event-aaaa-0000-0000-000000000001';
      const WATCHER = 'user-cccc-0000-0000-000000000003';

      vi.mocked(getDbUser).mockResolvedValue({ id: USER_A } as never);

      // target event select
      const eventSelect = makeSelectChain([
        { id: MY_EVENT, status: 'draft', orgId: 'org-aaaa-0000-0000-000000000001', startAt: new Date(Date.now() + 60_000), endAt: new Date(Date.now() + 120_000), title: 'My Event' },
      ]);
      // watchers select (no limit)
      const watchersSelect = makeSelectWhereResolved([{ watcherUserId: WATCHER }]);

      vi.mocked(db.select)
        .mockReturnValueOnce({ from: eventSelect.from } as never)
        .mockReturnValueOnce({ from: watchersSelect.from } as never);

      // conflict/permitted
      const { checkEventConflict, hasBarHostPermission } = await import('@/lib/events');
      vi.mocked(checkEventConflict).mockResolvedValue(false as never);
      vi.mocked(hasBarHostPermission).mockResolvedValue(true as never);

      const updateChain = makeUpdateChain();
      vi.mocked(db.update).mockReturnValue({ set: updateChain.set } as never);

      const { sendNotification } = await import('@/lib/notify');

      const result = await publishEvent(MY_EVENT);
      expect(result).toEqual({ ok: true });

      expect(sendNotification).toHaveBeenCalledWith(
        WATCHER,
        'watched_organizer_event_published',
        expect.stringContaining('My Event'),
        expect.any(String),
        { eventId: MY_EVENT },
        expect.stringContaining(MY_EVENT)
      );
    });
  });

  // ====================================================
  // テスト 2: 自分がイベントを主催していても別イベントに参加できること
  //
  // joinEvent は event.userId !== dbUser.id チェックを行わない設計。
  // イベント主催者 (userA) が別の published イベントに参加できることを確認する。
  // ====================================================
  describe('認可の境界確認: updateEventDraft は自分のイベントなら更新できること', () => {
    it('userA が自分のイベントを更新するとき ok を返す', async () => {
      const MY_EVENT = 'event-aaaa-0000-0000-000000000001';

      vi.mocked(getDbUser).mockResolvedValue({ id: USER_A } as never);

      // select で自分のイベントを返す（status: draft）
      const selectChain = makeSelectChain([{ id: MY_EVENT, status: 'draft' }]);
      vi.mocked(db.select).mockReturnValue({ from: selectChain.from } as never);

      // update チェーン
      const updateChain = makeUpdateChain();
      vi.mocked(db.update).mockReturnValue({ set: updateChain.set } as never);

      const formData = new FormData();
      formData.set('title', '正しいタイトル');
      formData.set('description', '正しい説明文です');

      const result = await updateEventDraft(MY_EVENT, formData);

      expect(result).toEqual({ ok: true });
      expect(db.update).toHaveBeenCalledOnce();
    });
  });
});
