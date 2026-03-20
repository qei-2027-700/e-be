import { describe, it, expect } from 'vitest';
import { resolveStatus, canTransition } from '../event-transitions';

const past = (offsetMs: number = -1000) => new Date(Date.now() + offsetMs);
const future = (offsetMs: number = 1000 * 60 * 60) => new Date(Date.now() + offsetMs);

describe('resolveStatus', () => {
  it('published + 開始前 → published', () => {
    expect(resolveStatus({ status: 'published', startAt: future(), endAt: future(2 * 3600_000) })).toBe('published');
  });

  it('published + 開催中 → ongoing', () => {
    expect(resolveStatus({ status: 'published', startAt: past(), endAt: future() })).toBe('ongoing');
  });

  it('published + 終了後 → completed', () => {
    expect(resolveStatus({ status: 'published', startAt: past(-7200_000), endAt: past() })).toBe('completed');
  });

  it('draft はそのまま draft', () => {
    expect(resolveStatus({ status: 'draft', startAt: past(), endAt: future() })).toBe('draft');
  });

  it('cancelled はそのまま cancelled', () => {
    expect(resolveStatus({ status: 'cancelled', startAt: past(), endAt: future() })).toBe('cancelled');
  });

  it('startAt/endAt が null なら published のまま', () => {
    expect(resolveStatus({ status: 'published', startAt: null, endAt: null })).toBe('published');
  });
});

describe('canTransition', () => {
  it('draft → pending: 全ロールで可能', () => {
    expect(canTransition('draft', 'pending', 'user')).toBe(true);
    expect(canTransition('draft', 'pending', 'org:owner')).toBe(true);
    expect(canTransition('draft', 'pending', 'org:member')).toBe(true);
  });

  it('draft → published: 許可なしの一般ユーザーは不可', () => {
    expect(canTransition('draft', 'published', 'user', false)).toBe(false);
  });

  it('draft → published: 許可ありなら可能', () => {
    expect(canTransition('draft', 'published', 'user', true)).toBe(true);
  });

  it('draft → published: org:owner は許可不要', () => {
    expect(canTransition('draft', 'published', 'org:owner', false)).toBe(true);
  });

  it('pending → published: org:owner が承認可能', () => {
    expect(canTransition('pending', 'published', 'org:owner')).toBe(true);
  });

  it('pending → rejected: org:member が却下可能', () => {
    expect(canTransition('pending', 'rejected', 'org:member')).toBe(true);
  });

  it('pending → published: 一般ユーザーは不可', () => {
    expect(canTransition('pending', 'published', 'user')).toBe(false);
  });

  it('published → cancelled: 可能', () => {
    expect(canTransition('published', 'cancelled', 'user')).toBe(true);
    expect(canTransition('published', 'cancelled', 'org:owner')).toBe(true);
  });

  it('cancelled → draft: 不可', () => {
    expect(canTransition('cancelled', 'draft', 'user')).toBe(false);
  });

  it('rejected → pending: 再申請可能', () => {
    expect(canTransition('rejected', 'pending', 'user')).toBe(true);
  });

  it('rejected → draft: 下書きに戻せる', () => {
    expect(canTransition('rejected', 'draft', 'user')).toBe(true);
  });

  it('platform:admin は全遷移が可能', () => {
    expect(canTransition('cancelled', 'draft', 'platform:admin')).toBe(true);
    expect(canTransition('cancelled', 'published', 'platform:admin')).toBe(true);
  });

  it('同じステータスへの遷移は常に true', () => {
    expect(canTransition('draft', 'draft', 'user')).toBe(true);
    expect(canTransition('published', 'published', 'user')).toBe(true);
  });
});
