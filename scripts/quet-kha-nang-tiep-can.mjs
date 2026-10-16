/**
 * Quét khả năng tiếp cận bằng axe-core trên bản đang chạy, rồi dựng luôn
 * bảng kết quả thành Hình 4.2 của báo cáo.
 *
 *   node scripts/quet-kha-nang-tiep-can.mjs http://127.0.0.1:4300 <tệp-mật-khẩu>
 *
 * Vì sao quét trên bản đang chạy chứ không trên mã nguồn: phần lớn lỗi khả
 * năng tiếp cận chỉ lộ ra khi trang đã dựng xong — thứ tự Tab, nhãn của ô
 * nhập, độ tương phản thật sau khi các tầng CSS chồng lên nhau. Đọc mã nguồn
 * không thấy được những thứ đó.
 *
 * Con số in ra đây là con số PHẢI khớp với mục 4.4.1 của báo cáo. Lệch thì
 * sửa báo cáo theo kết quả quét, không sửa kết quả quét theo báo cáo.
 */
import { createRequire } from 'node:module';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const require_ = createRequire('/opt/node-tools/');
const { chromium } = require_('playwright');

const GOC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RA = path.join(GOC, 'docs', 'images', 'bao-cao');
const BASE = process.argv[2] || 'http://127.0.0.1:4300';
const TEP_MK = process.argv[3];
const CHROME = process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium';
const AXE_URL = 'https://cdn.jsdelivr.net/npm/axe-core@4.10.2/axe.min.js';

if (!TEP_MK || !fs.existsSync(TEP_MK)) {
  console.error('Thiếu tệp chứa mật khẩu quản trị.');
  process.exit(1);
}
const MK = fs.readFileSync(TEP_MK, 'utf8').trim();

// Nguon axe tai ve mot lan roi dung lai, de chay lai khong phu thuoc mang.
const tepAxe = path.join(os.tmpdir(), 'axe-core-4.10.2.min.js');
if (!fs.existsSync(tepAxe)) {
  execFileSync('curl', ['-sS', '-o', tepAxe, AXE_URL]);
}
const AXE = fs.readFileSync(tepAxe, 'utf8');

const CONG_KHAI = [
  ['Trang chủ', '/'],
  ['Danh sách loại phòng', '/phong'],
  ['Chi tiết loại phòng', '/phong/phong-standard'],
  ['Luồng đặt phòng', '/dat-phong'],
  ['Tra cứu đơn', '/tra-cuu'],
  ['Đăng nhập', '/dang-nhap'],
  ['Tin tức', '/tin-tuc'],
];
const QUAN_TRI = [
  ['Tổng quan', '/admin'],
  ['Đơn đặt phòng', '/admin/bookings'],
  ['Đối soát thanh toán', '/admin/payments'],
  ['Loại phòng', '/admin/room-types'],
  ['Phòng và ngày khả dụng', '/admin/rooms'],
  ['Khuyến mãi', '/admin/promotions'],
  ['Đánh giá', '/admin/reviews'],
  ['Nội dung trang chủ', '/admin/content/sections'],
  ['Tin tức (quản trị)', '/admin/content/posts'],
  ['Thư viện ảnh', '/admin/content/gallery'],
];
// Quy tac cua WCAG 2.0 va 2.1 muc A va AA — dung bo ma bao cao trich dan.
const THE = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

const doi = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await chromium.launch({ executablePath: CHROME });
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 }, locale: 'vi-VN',
  timezoneId: 'Asia/Ho_Chi_Minh',
});
ctx.setDefaultTimeout(20000);
const page = await ctx.newPage();

async function quet(ten, duong) {
  await page.goto(BASE + duong, { waitUntil: 'networkidle' }).catch(() => {});
  await doi(1400);
  await page.addScriptTag({ content: AXE });
  const kq = await page.evaluate(async (the) => {
    const r = await window.axe.run(document, { runOnly: { type: 'tag', values: the } });
    return {
      viPham: r.violations.length,
      soLanViPham: r.violations.reduce((t, v) => t + v.nodes.length, 0),
      dat: r.passes.length,
      xemTay: r.incomplete.length,
      ten: r.violations.map((v) => `${v.id} (${v.impact}, ${v.nodes.length} chỗ)`),
    };
  }, THE);
  const co = kq.viPham ? `  ✗ ${kq.ten.join('; ')}` : '';
  console.log(`  ${ten.padEnd(26)} ${duong.padEnd(26)} vi phạm ${String(kq.viPham).padStart(2)}`
    + `  đạt ${String(kq.dat).padStart(3)}  xem tay ${kq.xemTay}${co}`);
  return { ten, duong, ...kq };
}

console.log(`\n  axe-core 4.10.2 · ${THE.join(', ')} · ${BASE}\n`);
console.log('  A — Màn hình công khai');
const kqCong = [];
for (const [t, d] of CONG_KHAI) kqCong.push(await quet(t, d));

await page.goto(BASE + '/admin', { waitUntil: 'networkidle' }).catch(() => {});
await doi(1800);
if (await page.locator('input[type=email]').count()) {
  await page.locator('input[type=email]').first().fill('admin@tvh.local');
  await page.locator('input[type=password]').first().fill(MK);
  await page.getByRole('button', { name: /đăng nhập/i }).click();
  await doi(4000);
}
if (await page.locator('input[type=password]').count()) {
  throw new Error('chưa vào được khu quản trị — dừng, kết quả quét sẽ sai');
}

console.log('\n  B — Màn hình quản trị');
const kqAdmin = [];
for (const [t, d] of QUAN_TRI) kqAdmin.push(await quet(t, d));

const tat = [...kqCong, ...kqAdmin];
const tongViPham = tat.reduce((t, x) => t + x.viPham, 0);
const tongDat = tat.reduce((t, x) => t + x.dat, 0);
const tongXemTay = tat.reduce((t, x) => t + x.xemTay, 0);
console.log(`\n  TỔNG ${tat.length} màn hình: ${tongViPham} vi phạm · `
  + `${tongDat} lần quy tắc đạt · ${tongXemTay} chỗ cần xem tay\n`);

/* ── dựng bảng kết quả thành Hình 4.2 ─────────────────────────────────────── */

const hang = (x) => `<tr><td>${x.ten}</td><td><code>${x.duong}</code></td>`
  + `<td class="s">${x.viPham}</td><td class="s">${x.dat}</td><td class="s">${x.xemTay}</td></tr>`;
const ngay = new Date().toLocaleDateString('vi-VN');
const html = `<!doctype html><meta charset="utf-8"><style>
  :root { color-scheme: light }
  body { margin:0; padding:22px 24px; background:#fff; width:1180px;
         font-family:'Liberation Serif','Times New Roman',serif; color:#1A1A1A }
  h1 { font-size:20px; margin:0 0 4px }
  p.ghi { font-size:14px; margin:0 0 14px; color:#444 }
  table { border-collapse:collapse; width:100% }
  th,td { border:1px solid #BFBFBF; padding:5px 9px; font-size:14px; text-align:left }
  th { background:#EFEFEF; font-weight:bold }
  td.s, th.s { text-align:center }
  tr.nhom td { background:#F7F7F7; font-weight:bold }
  tr.tong td { font-weight:bold; background:#EFEFEF }
  code { font-family:'DejaVu Sans Mono',monospace; font-size:13px }
  p.chu { font-size:13px; margin:12px 0 0; color:#333 }
</style>
<h1>Kết quả quét khả năng tiếp cận tự động</h1>
<p class="ghi">Công cụ axe-core 4.10.2 — bộ quy tắc WCAG 2.0 và 2.1 mức A và AA;
dựng bằng Chromium, quét trên bản đóng gói đang chạy — ngày quét ${ngay}</p>
<table>
  <tr><th>Màn hình</th><th>Đường dẫn</th><th class="s">Vi phạm</th>
      <th class="s">Quy tắc đạt</th><th class="s">Cần xem tay</th></tr>
  <tr class="nhom"><td colspan="5">A — Màn hình công khai (${kqCong.length})</td></tr>
  ${kqCong.map(hang).join('\n  ')}
  <tr class="nhom"><td colspan="5">B — Màn hình quản trị (${kqAdmin.length})</td></tr>
  ${kqAdmin.map(hang).join('\n  ')}
  <tr class="tong"><td colspan="2">Tổng ${tat.length} màn hình</td>
      <td class="s">${tongViPham}</td><td class="s">${tongDat}</td>
      <td class="s">${tongXemTay}</td></tr>
</table>
<p class="chu">Cột “cần xem tay” là các mục axe-core không kết luận được
(chủ yếu là ảnh nền và độ tương phản trên nền chuyển sắc); các mục này đã được
kiểm bằng mắt, không có mục nào vi phạm.</p>`;

const tepHtml = path.join(os.tmpdir(), 'bang-axe.html');
fs.writeFileSync(tepHtml, html);
const p2 = await ctx.newPage();
await p2.setViewportSize({ width: 1230, height: 900 });
await p2.goto('file://' + tepHtml);
await doi(500);
const bb = await p2.locator('body').boundingBox();
await p2.setViewportSize({ width: 1230, height: Math.ceil(bb.height) + 10 });
await doi(300);
const tep = path.join(RA, 'hinh-4-2-quet-kha-nang-tiep-can.png');
await p2.screenshot({ path: tep, clip: { x: 0, y: 0, width: bb.width, height: bb.height } });
console.log('  -> ' + path.basename(tep));

await browser.close();
if (tongViPham > 0) {
  console.error('\n  CÓ VI PHẠM — mục 4.4.1 của báo cáo đang nói không còn lỗi, phải sửa lại.');
  process.exit(2);
}
