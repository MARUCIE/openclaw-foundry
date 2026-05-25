import test from 'node:test';
import assert from 'node:assert/strict';

import { inferCategory } from '../scripts/merge-all-sources.mjs';

test('classifies X/Twitter data tools as search instead of entertainment', () => {
  assert.equal(
    inferCategory(
      'xquik',
      'Real-time X (Twitter) data: tweet search, user lookup, media, monitoring and more.',
    ),
    '搜索与研究',
  );
});

test('keeps generic media tools in the multimedia category', () => {
  assert.equal(
    inferCategory('Media Player', 'Play audio and video locally on the host.'),
    '多媒体',
  );
});

test('keeps games in the entertainment category', () => {
  assert.equal(
    inferCategory('Steam Game Helper', 'Manage Steam game launch tasks.'),
    '游戏娱乐',
  );
});
