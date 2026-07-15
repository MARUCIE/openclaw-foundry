import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import sessionModule from '../web/lib/session.ts';

const { safeReturnPath } = sessionModule as typeof import('../web/lib/session.ts');

function source(path: string): string {
  return readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
}

test('safeReturnPath accepts only local relative return paths', () => {
  assert.equal(safeReturnPath('/packs#install-product-manager'), '/packs#install-product-manager');
  assert.equal(safeReturnPath('/login?error=invalid'), '/login?error=invalid');
  assert.equal(safeReturnPath('https://evil.example/packs'), '/packs#wall');
  assert.equal(safeReturnPath('//evil.example/packs'), '/packs#wall');
  assert.equal(safeReturnPath('/%2Fevil.example/packs'), '/packs#wall');
  assert.equal(safeReturnPath('/packs%5Cevil'), '/packs#wall');
  assert.equal(safeReturnPath('/packs%0ASet-Cookie:x=y'), '/packs#wall');
  assert.equal(safeReturnPath(null), '/packs#wall');
});

test('public pack detail route stays metadata-only', () => {
  const packsRoute = source('worker/src/routes/packs.ts');
  assert.match(packsRoute, /pack:\s*mapPack\(row\)/);
  assert.doesNotMatch(packsRoute, /claudeMd:\s*pack\.merged/);
  assert.doesNotMatch(packsRoute, /agentsMd:\s*pack\.merged/);
  assert.doesNotMatch(packsRoute, /settings:\s*pack\.merged/);
  assert.doesNotMatch(packsRoute, /promptsMd:\s*pack\.merged/);
});

test('generated installers use download tokens, not bearer sessions', () => {
  const packsRoute = source('worker/src/routes/packs.ts');
  assert.match(packsRoute, /mintDownloadToken\(c\.env\.DB,\s*id,\s*access\.user\.id\)/);
  assert.doesNotMatch(packsRoute, /\|\|\s*bearer/);
  assert.doesNotMatch(packsRoute, /tokenForInstaller[^\n]*bearer/);
});

test('login and oauth callback surfaces use safe return-path handling', () => {
  const files = [
    'web/app/login/page.tsx',
    'web/app/auth/callback/page.tsx',
    'web/app/auth/wechat-landing/page.tsx',
    'worker/src/routes/auth-wechat.ts',
  ];
  for (const file of files) {
    assert.match(source(file), /safeReturnPath/, `${file} must use safeReturnPath`);
  }
});

test('protected download re-auth redirects use the shared loginRedirect helper', () => {
  const helper = source('web/lib/protected-downloads.ts');
  assert.match(helper, /loginRedirect\(returnPath\)/);
  assert.doesNotMatch(helper, /\/login\?return=\$\{encodeURIComponent\(returnPath\)\}/);
});
