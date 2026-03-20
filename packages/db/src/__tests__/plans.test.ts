import { describe, it, expect } from 'vitest';
import { canUseFeature } from '../plans';

describe('canUseFeature', () => {
  describe('premium プラン', () => {
    it('全機能が使える', () => {
      expect(canUseFeature('premium', 'fc_request')).toBe(true);
      expect(canUseFeature('premium', 'ai_export')).toBe(true);
      expect(canUseFeature('premium', 'analytics')).toBe(true);
      expect(canUseFeature('premium', 'multi_store')).toBe(true);
    });
  });

  describe('free プラン', () => {
    it('fc_request は使えない', () => {
      expect(canUseFeature('free', 'fc_request')).toBe(false);
    });

    it('ai_export は使えない', () => {
      expect(canUseFeature('free', 'ai_export')).toBe(false);
    });

    it('analytics は使えない', () => {
      expect(canUseFeature('free', 'analytics')).toBe(false);
    });

    it('multi_store は使える（プレミアム限定ではない）', () => {
      expect(canUseFeature('free', 'multi_store')).toBe(true);
    });
  });
});
