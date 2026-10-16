/**
 * Chụp lại các ảnh màn hình của quyển báo cáo trên bản đang chạy thật.
 *
 *   node scripts/chup-anh-bao-cao.mjs http://127.0.0.1:4300 <tệp-chứa-mật-khẩu>
 *
 * Vì sao cần kịch bản riêng thay vì chụp tay: tám tấm ảnh này phải chụp lại
 * mỗi khi giao diện đổi, và chụp tay thì mỗi lần ra một khổ khác nhau — lần
 * sau ghép vào Word lại phải căn lại từ đầu. Ở đây khổ ảnh, bề rộng khung
 * nhìn và tỉ lệ điểm ảnh đều cố định trong mã.
 *
 * Ảnh ghi THẲNG vào docs/images/bao-cao/ theo đúng tên mà `[Hình X.Y]` trong
 * Markdown trỏ tới, nên không phải đổi tên tay.
 *
 * CHỐT CỨNG: vào khu quản trị mà trên trang vẫn còn ô nhập mật khẩu thì kịch
 * bản NÉM LỖI chứ không chụp tiếp. Không có chốt này thì một lần đăng nhập
 * hỏng sẽ cho ra hai tấm ảnh trang đăng nhập mang tên "dashboard" và
 * "ngay-kha-dung" — nhìn qua rất giống thật, và không ai phát hiện ra cho tới
 * lúc bảo vệ.
 *
 * Mật khẩu KHÔNG bao giờ in ra màn hình hay ghi vào kho mã nguồn.
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
const TAM = fs.mkdtempSync(path.join(os.tmpdir(), 'chup-bao-cao-'));

if (!TEP_MK || !fs.existsSync(TEP_MK)) {
  console.error('Thiếu tệp chứa mật khẩu quản trị. Dùng:');
  console.error('  node scripts/chup-anh-bao-cao.mjs <địa-chỉ> <tệp-mật-khẩu>');
  process.exit(1);
}
const MK_CU = fs.readFileSync(TEP_MK, 'utf8').trim();
// Mat khau moi sinh ngau nhien, ghi ra thu muc tam cua he dieu hanh chu khong
// vao repo. Chi in duong dan.
const MK_MOI = 'Tvh' + Math.random().toString(36).slice(2, 10) + '!7Qx';

const log = (s) => console.log('  ' + s);
const doi = (ms) => new Promise((r) => setTimeout(r, ms));

/** Cuon het trang roi ve dau, de anh dat loading="lazy" kip ve truoc khi chup. */
async function napHetAnh(page) {
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 80));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(700);
}

/**
 * Ghep may tam anh thanh mot hinh nam ngang, moi tam mot nhan o duoi.
 *
 * Ghep bang chinh trinh duyet chu khong bang cong cu anh: nhan chu duoi moi
 * tam phai cung phong chu voi ca quyen bao cao, va trinh duyet dang mo san.
 */
async function ghepNgang(page, tam, nhan, tepRa, rongMoiTam = 460) {
  const html = `<!doctype html><meta charset="utf-8"><style>
    :root { color-scheme: light }
    body { margin:0; padding:18px; background:#fff; display:flex; gap:18px;
           align-items:flex-start; font-family:'Liberation Serif',serif }
    figure { margin:0; flex:0 0 ${rongMoiTam}px }
    img { width:100%; display:block; border:1px solid #D8D8D8; border-radius:3px }
    figcaption { margin-top:7px; font-size:13px; color:#1A1A1A; text-align:center }
  </style>` + tam.map((t, i) =>
    `<figure><img src="file://${t}"><figcaption>${nhan[i]}</figcaption></figure>`).join('');
  const tepHtml = path.join(TAM, 'ghep-' + path.basename(tepRa) + '.html');
  fs.writeFileSync(tepHtml, html);
  await page.goto('file://' + tepHtml);
  await page.waitForTimeout(400);
  const khung = await page.locator('body').boundingBox();
  await page.setViewportSize({ width: Math.ceil(khung.width), height: Math.ceil(khung.height) });
  await page.waitForTimeout(200);
  await page.screenshot({ path: tepRa, clip: { x: 0, y: 0, width: khung.width, height: khung.height } });
  log(`${path.basename(tepRa)}  (ghép ${tam.length} tấm)`);
}

const browser = await chromium.launch({ executablePath: CHROME });
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
  locale: 'vi-VN',
  timezoneId: 'Asia/Ho_Chi_Minh',
});
ctx.setDefaultTimeout(15000);

// Anh ma QR do dich vu ben ngoai sinh ra. Trinh duyet trong moi truong nay
// khong ra duoc Internet, nen chan lay yeu cau do roi tai bang curl — cong cu
// da duoc cau hinh san proxy va chung chi. Khong ha thap kiem tra TLS o dau.
await ctx.route('**qr.sepay.vn/**', async (route) => {
  try {
    const anh = execFileSync('curl', ['-sS', '--max-time', '20', route.request().url()],
      { maxBuffer: 8 << 20 });
    await route.fulfill({ status: 200, contentType: 'image/png', body: anh });
  } catch {
    await route.abort();
  }
});
const page = await ctx.newPage();
// Ghi lai moi loi tu API. Khong co cai nay thi mot lan dat phong bi tu choi
// chi hien ra duoi dang "khong toi duoc man thanh toan", khong noi vi sao.
const loiApi = [];
page.on('response', (r) => {
  if (r.url().includes('/api/') && r.status() >= 400) {
    loiApi.push(`${r.status()} ${r.request().method()} ${r.url().replace(BASE, '')}`);
  }
});

const di = async (p, cho = 1400) => {
  await page.goto(BASE + p, { waitUntil: 'networkidle' }).catch(() => {});
  await doi(cho);
};
const chup = async (ten, { toanTrang = true, vung = null } = {}) => {
  const tep = path.join(RA, ten);
  if (vung) await vung.screenshot({ path: tep });
  else await page.screenshot({ path: tep, fullPage: toanTrang });
  const { width, height } = await anhCo(tep);
  log(`${ten}  ${width}x${height}`);
  return tep;
};
const anhCo = async (tep) => {
  const d = fs.readFileSync(tep).subarray(16, 24);
  return { width: d.readUInt32BE(0), height: d.readUInt32BE(4) };
};

/* ─────────────────────────── 1. Trang khách ─────────────────────────────── */

// Nhieu trang cua ban moi dai hon mot man hinh nhieu lan. Chup tron ca trang
// thi ra tam anh cao gap ba be ngang, va bo xuat ban buoc phai thu be ngang
// xuong con 4,6cm de vua tran chieu cao — in ra khong doc duoc chu nao. Nen
// moi hinh co mot CHIEU CAO KHUNG NHIN rieng, chon theo ti le cua ban cu.
/**
 * Chup dung mot khoi noi dung thay vi ca khung nhin.
 *
 * Man thanh toan va man doi mat khau deu la mot the nho nam giua trang: chup
 * nguyen khung nhin thi nua duoi la chan trang den si, con hai ben la khoang
 * trang. Chup dung the thi hinh vua gon vua doc duoc chu.
 */
const chupVung = async (ten, sels, luiCao = 900, dem = 16, gop = false) => {
  // Mac dinh lay khoi dau tien tim thay. 'gop' thi gop khung cua tat ca lai —
  // dung khi mot cum bi chia thanh may phan tu roi nhau, nhu tieu de va bieu
  // mau cua man doi mat khau.
  const hop = [];
  for (const sel of sels) {
    const l = page.locator(sel).first();
    if (!await l.count()) continue;
    const bb = await l.boundingBox();
    if (bb && bb.width > 60 && bb.height > 20) {
      hop.push(bb);
      if (!gop) break;
    }
  }
  if (hop.length) {
    // Chup theo o cat co chua LE chu khong chup thang phan tu: chup thang thi
    // duong vien va dong tieu de sat mep tren bi cat mat mot vai diem anh.
    const x1 = Math.max(0, Math.min(...hop.map((b) => b.x)) - dem);
    const y1 = Math.max(0, Math.min(...hop.map((b) => b.y)) - dem);
    const x2 = Math.max(...hop.map((b) => b.x + b.width)) + dem;
    const y2 = Math.max(...hop.map((b) => b.y + b.height)) + dem;
    const kn = page.viewportSize();
    const clip = { x: x1, y: y1,
      width: Math.min(x2 - x1, kn.width - x1), height: Math.min(y2 - y1, kn.height - y1) };
    const tep = path.join(RA, ten);
    await page.screenshot({ path: tep, clip });
    const { width, height } = await anhCo(tep);
    log(`${ten}  ${width}x${height}`);
    return tep;
  }
  await page.setViewportSize({ width: 1440, height: luiCao });
  await doi(500);
  return chup(ten, { toanTrang: false });
};

const chupKhung = async (ten, cao) => {
  await page.setViewportSize({ width: 1440, height: cao });
  await doi(700);
  await napHetAnh(page);
  await page.evaluate(() => window.scrollTo(0, 0));
  await doi(400);
  return chup(ten, { toanTrang: false });
};

// Hình 3.10 — trang chủ, mở sẵn lịch chọn ngày
await page.setViewportSize({ width: 1440, height: 1150 });
await di('/');
await napHetAnh(page);
await page.evaluate(() => window.scrollTo(0, 0));
await doi(500);
await page.getByRole('button', { name: /chọn ngày/i }).first().click().catch(() => {});
await doi(1000);
await page.evaluate(() => window.scrollTo(0, 0));
await doi(400);
await chup('hinh-3-10-trang-chu.png', { toanTrang: false });
await page.setViewportSize({ width: 1440, height: 900 });

// Hình A.3 — trang chi tiết một loại phòng
await di('/phong/phong-standard', 2000);
await chupKhung('hinh-a-3-chi-tiet-loai-phong.png', 1525);
await page.setViewportSize({ width: 1440, height: 900 });

/* ──────────────── 2. Đặt một đơn thật để lấy màn thanh toán ─────────────── */

// Ba buoc cua luong dat phong la ba man cua chinh trinh tu /dat-phong, khong
// phai ba trang roi rac — thanh buoc o dau trang hien ro dang o buoc nao.
await di('/');
await page.getByRole('button', { name: /chọn ngày/i }).first().click().catch(() => {});
await doi(800);
await page.getByLabel('Tháng sau').click().catch(() => {});
await doi(700);
// O ngay la <button role="gridcell"> voi chu so nam trong the <span> con, va
// nhung ngay da qua thi disabled — nen phai loc ca hai dieu kien.
const ngay = page.locator('button[role="gridcell"]:not([disabled])');
await ngay.nth(6).click().catch(() => {});
await doi(500);
await ngay.nth(9).click().catch(() => {});
await doi(800);
const buoc1 = path.join(TAM, 'buoc-1.png');
await page.screenshot({ path: buoc1, fullPage: false });

await page.getByRole('button', { name: /tìm phòng/i }).first().click().catch(() => {});
await doi(3000);
if (!/dat-phong/.test(page.url())) throw new Error('không sang được bước chọn phòng');
await napHetAnh(page);
await page.evaluate(() => window.scrollTo(0, 0));
await doi(400);
const buoc2 = path.join(TAM, 'buoc-2.png');
await page.screenshot({ path: buoc2, fullPage: false });

await page.getByRole('button', { name: /^chọn phòng$/i }).first().click().catch(() => {});
await doi(2500);
await page.getByLabel(/họ và tên/i).first().fill('Nguyễn Hoàng Quân').catch(() => {});
await page.getByLabel(/số điện thoại/i).first().fill('0912345678').catch(() => {});
await page.getByLabel(/email/i).first().fill('quan.demo@example.vn').catch(() => {});
await page.getByLabel(/yêu cầu thêm/i).first()
  .fill('Cho mình nhận phòng sớm khoảng 12 giờ trưa nếu phòng đã dọn xong.')
  .catch(() => {});
await doi(700);
await page.evaluate(() => window.scrollTo(0, 0));
await doi(300);
const buoc3 = path.join(TAM, 'buoc-3.png');
await page.screenshot({ path: buoc3, fullPage: false });

// Gui luon tren chinh man dang mo — di ra roi quay lai thi mat het o da dien
await page.getByRole('button', { name: /đặt phòng và chuyển sang thanh toán/i }).first()
  .click().catch(() => {});
await doi(4000);

// Hình 3.12 — màn thanh toán của đúng đơn vừa đặt
if (!/thanh-toan/.test(page.url())) {
  const canh = (await page.locator('[role=alert],[class*=error]').allTextContents())
    .map((x) => x.trim().replace(/\s+/g, ' ')).filter(Boolean).join(' / ');
  throw new Error('không tới được màn thanh toán — dừng, không chụp ảnh sai.'
    + `\n  đang ở: ${page.url().replace(BASE, '')}`
    + `\n  lỗi API: ${loiApi.join('; ') || '(không có)'}`
    + `\n  thông báo trên trang: ${canh || '(không có)'}`);
}
await napHetAnh(page);
await page.evaluate(() => window.scrollTo(0, 0));
await doi(400);
await chupVung('hinh-3-12-thanh-toan.png', ['main section', 'main'], 760);
await page.setViewportSize({ width: 1440, height: 900 });

// Hình 3.11 — ba bước của luồng đặt phòng
await ghepNgang(page, [buoc1, buoc2, buoc3],
  ['Bước 1 — chọn ngày và số khách', 'Bước 2 — chọn phòng, giá tính cả kỳ',
   'Bước 3 — xác nhận và nhập thông tin'],
  path.join(RA, 'hinh-3-11-ba-buoc-dat-phong.png'), 470);


/* ─────────────────── 3. Ba kích thước màn hình (Hình 4.3) ───────────────── */

const KHO = [
  { w: 390, h: 844, ten: 'Điện thoại — 390px' },
  { w: 820, h: 1180, ten: 'Máy tính bảng — 820px' },
  { w: 1440, h: 900, ten: 'Máy tính để bàn — 1440px' },
];
const tamKho = [];
for (const k of KHO) {
  const p2 = await ctx.newPage();
  await p2.setViewportSize({ width: k.w, height: k.h });
  await p2.goto(BASE + '/', { waitUntil: 'networkidle' }).catch(() => {});
  await doi(1500);
  await napHetAnh(p2);
  await p2.evaluate(() => window.scrollTo(0, 0));
  await doi(300);
  const t = path.join(TAM, `kho-${k.w}.png`);
  await p2.screenshot({ path: t, fullPage: false });
  tamKho.push(t);
  await p2.close();
}
await ghepNgang(page, tamKho, KHO.map((k) => k.ten),
  path.join(RA, 'hinh-4-3-ba-kich-thuoc-man-hinh.png'), 330);

/* ──────────── 3b. Độ tương phản nút chính (Hình 4.1) ───────────────────── */

// Khong go cung ma mau vao day. Bang mau cua giao dien da doi mot lan giua
// chung ky, va mot tam hinh ghi ma mau cu thi sai ca ba con so tren no. Nen
// DO mau that cua nut tren trang dang chay roi moi dung hinh.
await di('/');
const doMau = await page.evaluate(() => {
  const hex = (s) => {
    const m = s.match(/\d+/g);
    return m ? '#' + m.slice(0, 3).map((x) => (+x).toString(16).padStart(2, '0')).join('').toUpperCase() : s;
  };
  const sang = (s) => s.match(/\d+/g).slice(0, 3).map(Number).map((v) => {
    v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  }).reduce((t, v, i) => t + [0.2126, 0.7152, 0.0722][i] * v, 0);
  const ti = (a, b) => {
    const l1 = sang(a), l2 = sang(b); const [h, l] = l1 > l2 ? [l1, l2] : [l2, l1];
    return (h + 0.05) / (l + 0.05);
  };
  // Nut chinh: nut co nen dam nhat trong trang
  let nut = null;
  for (const el of document.querySelectorAll('button, a')) {
    const c = getComputedStyle(el);
    if (c.backgroundColor === 'rgba(0, 0, 0, 0)') continue;
    if (!(el.textContent || '').trim()) continue;
    if (sang(c.backgroundColor) < 0.2) { nut = { el, c }; break; }
  }
  if (!nut) return null;
  const nen = nut.c.backgroundColor;
  // Mau chu bi "ke thua" la mau chu than bai — dung day la mau cua loi cu
  const chuThan = getComputedStyle(document.body).color;
  return {
    nen: hex(nen), nenRaw: nen,
    sau: hex(nut.c.color), tiSau: +ti(nut.c.color, nen).toFixed(2),
    truoc: hex(chuThan), tiTruoc: +ti(chuThan, nen).toFixed(2),
    chu: (nut.el.textContent || '').trim().slice(0, 18),
  };
});
if (!doMau) throw new Error('không đo được màu của nút chính');
log(`đo được: chữ ${doMau.sau} trên nền ${doMau.nen} = ${doMau.tiSau}:1`
  + `  ·  lỗi cũ ${doMau.truoc} trên nền ${doMau.nen} = ${doMau.tiTruoc}:1`);

const so = (x) => String(x).replace('.', ',');
const oNut = (mauChu, mauNen) => `display:inline-block;padding:11px 26px;border-radius:3px;`
  + `background:${mauNen};color:${mauChu};font-size:16px;font-weight:600;`
  + `font-family:'DejaVu Sans',sans-serif`;
const htmlTp = `<!doctype html><meta charset="utf-8"><style>
  :root { color-scheme: light }
  body { margin:0; padding:20px; background:#fff; width:1100px;
         font-family:'Liberation Serif','Times New Roman',serif; color:#1A1A1A }
  .doi { display:flex; gap:18px }
  .o { flex:1; border:2px solid; border-radius:4px; padding:14px 16px }
  .xau { border-color:#C0392B; background:#FDF2F0 }
  .tot { border-color:#1E7A52; background:#F1F8F4 }
  h2 { font-size:15px; margin:0 0 10px }
  .mau { text-align:center; margin:14px 0 12px }
  .ghi { font-size:14px; line-height:1.55; margin:0 }
  code { font-family:'DejaVu Sans Mono',monospace; font-size:13px }
  p.chan { font-size:13.5px; line-height:1.6; margin:14px 0 0; color:#333 }
</style>
<div class="doi">
  <div class="o xau">
    <h2>Trước — quy tắc <code>button { color: inherit }</code> nằm ngoài tầng CSS</h2>
    <div class="mau"><span style="${oNut(doMau.truoc, doMau.nen)}">${doMau.chu}</span></div>
    <p class="ghi">Chữ <code>${doMau.truoc}</code> trên nền <code>${doMau.nen}</code><br>
      Tỉ lệ tương phản <b>${so(doMau.tiTruoc)} : 1</b> — dưới ngưỡng 4,5 : 1 của WCAG AA</p>
  </div>
  <div class="o tot">
    <h2>Sau — tệp nền được bọc trong <code>@layer base</code></h2>
    <div class="mau"><span style="${oNut(doMau.sau, doMau.nen)}">${doMau.chu}</span></div>
    <p class="ghi">Chữ <code>${doMau.sau}</code> trên nền <code>${doMau.nen}</code><br>
      Tỉ lệ tương phản <b>${so(doMau.tiSau)} : 1</b> — vượt cả ngưỡng 7 : 1 của mức AAA</p>
  </div>
</div>
<p class="chan">Tỉ lệ tính theo công thức độ chói tương đối của WCAG 2.1. Nguyên nhân:
tệp nền của dự án nạp ngoài mọi tầng <code>@layer</code>, nên quy tắc không thuộc
tầng nào luôn thắng mọi quy tắc có tầng. Bài kế đó đặt lại trong
<code>@layer base</code> nên <code>&lt;button&gt;</code> không còn kế thừa màu chữ của thân bài.</p>`;
const tepTp = path.join(TAM, 'tuong-phan.html');
fs.writeFileSync(tepTp, htmlTp);
await page.setViewportSize({ width: 1150, height: 700 });
await page.goto('file://' + tepTp);
await doi(500);
const bbTp = await page.locator('body').boundingBox();
await page.setViewportSize({ width: 1150, height: Math.ceil(bbTp.height) + 8 });
await doi(300);
await page.screenshot({ path: path.join(RA, 'hinh-4-1-do-tuong-phan.png'),
  clip: { x: 0, y: 0, width: bbTp.width, height: bbTp.height } });
log('hinh-4-1-do-tuong-phan.png  (dựng từ màu đo được)');
await page.setViewportSize({ width: 1440, height: 900 });

/* ───────────────────────── 4. Khu quản trị ──────────────────────────────── */

await page.setViewportSize({ width: 1440, height: 900 });
await di('/admin', 2200);
if (await page.locator('input[type=email]').count()) {
  await page.locator('input[type=email]').first().fill('admin@tvh.local');
  await page.locator('input[type=password]').first().fill(MK_CU);
  await page.getByRole('button', { name: /đăng nhập/i }).click();
  await doi(4000);
}

// Hình A.2 — màn bắt đổi mật khẩu tạm ở lần đăng nhập đầu
if (/doi-mat-khau/.test(page.url())) {
  await napHetAnh(page);
  await page.evaluate(() => window.scrollTo(0, 0));
  await doi(300);
  await chupVung('hinh-a-2-doi-mat-khau.png',
    ['h1', 'h2', 'main', 'form', 'button[type=submit]'], 700, 22, true);
  await page.setViewportSize({ width: 1440, height: 900 });
  const ps = page.locator('input[type=password]');
  const n = await ps.count();
  await ps.nth(0).fill(MK_CU);
  await ps.nth(1).fill(MK_MOI);
  if (n > 2) await ps.nth(2).fill(MK_MOI);
  await page.getByRole('button', { name: /đổi|lưu|xác nhận|cập nhật/i }).first().click();
  await doi(4000);
  const tepMk = path.join(os.tmpdir(), 'homestay-bao-cao-admin.pw');
  fs.writeFileSync(tepMk, MK_MOI, { mode: 0o600 });
  log('mật khẩu quản trị mới đã ghi vào: ' + tepMk);
} else {
  log('không gặp màn đổi mật khẩu — giữ nguyên Hình A.2 cũ');
}

await di('/admin', 2500);
if (await page.locator('input[type=password]').count()) {
  throw new Error('chưa vào được khu quản trị — dừng, không chụp ảnh trang đăng nhập');
}
await chupKhung('hinh-3-13-dashboard.png', 1388);   // Hình 3.13 — trang tổng quan

await page.setViewportSize({ width: 1440, height: 900 });
await di('/admin/rooms', 2500);
await chupKhung('hinh-a-1-ngay-kha-dung.png', 1485); // Hình A.1 — ngày khả dụng

await browser.close();
fs.rmSync(TAM, { recursive: true, force: true });
console.log('xong');
