import { describe, it, expect, vi, beforeEach } from 'vitest';

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
}));

vi.mock('@/lib/notify', () => ({
  sendNotification: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@e-be/db', () => ({
  NOTIFICATION_TYPES: {
    PARTICIPATION_RECEIVED: 'participation_received',
  },
}));

import { db } from '@/lib/db';
import { getDbUser } from '@/lib/auth';
import { joinEvent } from '../participation';

// Drizzle クエリチェーンヘルパー
function makeSelectChain(resolvedValue: unknown[]) {
  const limit = vi.fn().mockResolvedValue(resolvedValue);
  const where = vi.fn().mockReturnValue({ limit });
  const from = vi.fn().mockReturnValue({ where });
  return { from, where, limit };
}

function makeSelectWithCountChain(total: number) {
  const where = vi.fn().mockResolvedValue([{ total }]);
  const from = vi.fn().mockReturnValue({ where });
  return { from, where };
}

// テスト用 ID
const USER_ORGANIZER = 'user-organizer-000-000000000001'; // イベントを主催しているユーザー
const USER_EVENT_OWNER = 'user-owner-0000-000000000002'; // 参加対象イベントの主催者
const OTHER_EVENT_ID = 'event-other-0000-000000000001'; // 別の公開イベント

describe('joinEvent — イベント参加申請', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * テスト: 自身がイベントを主催していても、別の公開イベントに参加できること
   *
   * joinEvent の WHERE 条件は:
   *   - events.status = 'published'
   *   - events.deleted_at IS NULL
   * であり、events.userId ≠ dbUser.id のチェックはない。
   * つまり、イベント主催者であるかどうかに関係なく参加申請できる。
   */
  it('自身がイベント主催者でも、別の公開イベントに参加申請できること', async () => {
    // USER_ORGANIZER としてログイン（自分自身も別イベントを主催している）
    vi.mocked(getDbUser).mockResolvedValue({ id: USER_ORGANIZER } as never);

    // 1回目の select: published イベントを返す（USER_EVENT_OWNER が主催）
    const eventChain = makeSelectChain([
      {
        id: OTHER_EVENT_ID,
        userId: USER_EVENT_OWNER, // 別ユーザーが主催（organizer ではない）
        startAt: new Date(Date.now() + 86400000), // 24時間後
        maxParticipants: null, // 定員なし
      },
    ]);

    // 2回目の select: 既存の参加レコードなし
    const existingChain = makeSelectChain([]);

    vi.mocked(db.select)
      .mockReturnValueOnce({ from: eventChain.from } as never)
      .mockReturnValueOnce({ from: existingChain.from } as never);

    // insert: 参加レコードを挿入
    vi.mocked(db.insert).mockReturnValue({
      values: vi.fn().mockResolvedValue(undefined),
    } as never);

    const result = await joinEvent(OTHER_EVENT_ID);

    // 参加申請が成功すること
    expect(result).toEqual({ ok: true });

    // 参加レコードが挿入されたこと
    expect(db.insert).toHaveBeenCalledOnce();
  });

  it('既に参加済みのイベントに再度申請すると already_registered を返す', async () => {
    vi.mocked(getDbUser).mockResolvedValue({ id: USER_ORGANIZER } as never);

    const eventChain = makeSelectChain([
      {
        id: OTHER_EVENT_ID,
        userId: USER_EVENT_OWNER,
        startAt: new Date(Date.now() + 86400000),
        maxParticipants: null,
      },
    ]);

    // 既存の参加レコードあり（status: registered）
    const existingChain = makeSelectChain([
      { id: 'participation-001', status: 'registered' },
    ]);

    vi.mocked(db.select)
      .mockReturnValueOnce({ from: eventChain.from } as never)
      .mockReturnValueOnce({ from: existingChain.from } as never);

    const result = await joinEvent(OTHER_EVENT_ID);

    expect(result).toEqual({ error: 'already_registered' });
    expect(db.insert).not.toHaveBeenCalled();
  });

  it('定員が満員のイベントには参加申請できない', async () => {
    vi.mocked(getDbUser).mockResolvedValue({ id: USER_ORGANIZER } as never);

    const eventChain = makeSelectChain([
      {
        id: OTHER_EVENT_ID,
        userId: USER_EVENT_OWNER,
        startAt: new Date(Date.now() + 86400000),
        maxParticipants: 10, // 定員10名
      },
    ]);

    // 既存の参加レコードなし
    const existingChain = makeSelectChain([]);

    // 定員カウント（10名 = 定員に達している）
    const countChain = makeSelectWithCountChain(10);

    vi.mocked(db.select)
      .mockReturnValueOnce({ from: eventChain.from } as never)
      .mockReturnValueOnce({ from: existingChain.from } as never)
      .mockReturnValueOnce({ from: countChain.from } as never);

    const result = await joinEvent(OTHER_EVENT_ID);

    expect(result).toEqual({ error: 'full_capacity' });
    expect(db.insert).not.toHaveBeenCalled();
  });

  it('未認証ユーザーは参加申請できない', async () => {
    vi.mocked(getDbUser).mockResolvedValue(null);

    const result = await joinEvent(OTHER_EVENT_ID);

    expect(result).toEqual({ error: 'unauthorized' });
    expect(db.select).not.toHaveBeenCalled();
  });
});
