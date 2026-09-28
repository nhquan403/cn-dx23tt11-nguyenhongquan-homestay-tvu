/**
 * Chup lai DUNG ba anh man hinh dung trong README tren ban dang chay that.
 *
 *   docker compose up -d
 *   docker compose logs api | grep -i -A 4 'mat khau admin demo'
 *   node scripts/chup-anh-readme.mjs http://localhost <mat-khau-quan-tri>
 *
 * Ghi de thang vao docs/images/: landing.png, admin-dashboard.png,
 * admin-payments.png. Khong doi ten tep vi README tro thang vao ba ten do.
 *
 * CHOT CUNG cho hai anh khu quan tri: neu sau khi dang nhap tren trang van con
 * o nhap mat khau, kich ban NEM LOI thay vi chup tiep. Khong co chot nay thi
 * mot lan dang nhap that bai se cho ra hai tam anh trang dang nhap mang ten
 * "admin-dashboard.png" va "admin-payments.png" — nhin qua rat giong that, va
 * khong ai phat hien cho toi luc bao ve.
 *
 * Mat khau KHONG bao gio in ra man hinh hay ghi vao tep nao.
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const BASE = process.argv[2] || 'http://localhost';
const ADMIN_PW = process.argv[3] || process.env.ADMIN_PW;
const CHROME = process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const OUTDIR = path.join(ROOT, 'docs', 'images');
const EMAIL = process.env.ADMIN_EMAIL || 'admin@tvh.local';

if (!ADMIN_PW) {
  console.error('Thieu mat khau quan tri.');
  console.error("Lay bang: docker compose logs api | grep -i -A 4 'mat khau admin demo'");
  process.exit(1);
}

fs.mkdirSync(OUTDIR, { recursive: true });

/** Cuon het trang roi ve dau, de anh dat loading="lazy" kip ve truoc khi chup. */
async function napHetAnh(page) {
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 700) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 90));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(900);
}

async function chup(page, duong, ten) {
  await page.goto(BASE + duong, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await napHetAnh(page);
  const ra = path.join(OUTDIR, ten);
  await page.screenshot({ path: ra, fullPage: true });
  const kb = (fs.statSync(ra).size / 1024).toFixed(0);
  console.log(`  ${ten.padEnd(22)} ${kb.padStart(5)} KB   (${duong})`);
}

const browser = await chromium.launch({ executablePath: CHROME });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'vi-VN' });
const page = await ctx.newPage();

try {
  console.log(`Chup tu ${BASE} o be ngang 1440px:\n`);

  // ── Trang khach ────────────────────────────────────────────────────────────
  await chup(page, '/', 'landing.png');

  // ── Dang nhap khu quan tri ────────────────────────────────────────────────
  await page.goto(`${BASE}/admin`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  await page.locator('input[type=email]').fill(EMAIL);
  await page.locator('input[type=password]').first().fill(ADMIN_PW);
  await page.getByRole('button', { name: /đăng nhập/i }).click();
  await page.waitForTimeout(4000);

  await page.goto(`${BASE}/admin/bookings`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  if (await page.locator('input[type=password]').count()) {
    throw new Error(
      'Chua vao duoc khu quan tri — van con o nhap mat khau. Khong chup tiep.\n' +
        '  Mat khau tam chi dung duoc mot lan: lan dang nhap dau he thong bat doi.\n' +
        '  Lay mat khau moi: docker compose down -v && docker compose up -d',
    );
  }
  const soHang = await page.locator('tbody tr').count();
  if (soHang === 0) {
    throw new Error('Vao duoc khu quan tri nhung bang don trong — du lieu mau chua nap xong.');
  }
  console.log(`  [chot] /admin/bookings co ${soHang} hang du lieu that — da vao that su\n`);

  // ── Hai man quan tri ──────────────────────────────────────────────────────
  await chup(page, '/admin', 'admin-dashboard.png');
  await chup(page, '/admin/payments', 'admin-payments.png');

  console.log('\nXong. Ba tep da ghi de trong docs/images/.');
  console.log('Nho go ghi chu "ban giao dien CU" o muc Man hinh trong README.md.');
} finally {
  await browser.close();
}
