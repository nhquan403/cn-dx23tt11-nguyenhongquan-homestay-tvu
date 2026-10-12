/**
 * Quay video trinh dien TOAN BO he thong tren ban dang chay that.
 *
 * Di het ba vai: khach dat phong va thanh toan, chu homestay xu ly don va
 * phong, quan tri vien sua noi dung va khuyen mai. Moi thao tac deu la thao
 * tac THAT tren he thong that — khong co canh nao dung dan.
 *
 *   docker compose down -v && docker compose up -d
 *   docker compose logs api | grep "Mat khau"
 *   node scripts/quay-demo.mjs http://localhost <mat-khau-quan-tri>
 *
 * PHAI dung CSDL sach truoc moi lan quay. Kich ban di qua buoc buoc doi mat
 * khau tam, nen chay lan thu hai voi cung mat khau cu se dang nhap that bai —
 * va nua sau video thanh anh chup trang dang nhap. Co chot kiem tra chan viec
 * do, nhung dung lai CSDL van la cach re nhat.
 *
 * Video ra dang .webm; truyen duong dan ffmpeg qua FFMPEG=... de doi sang mp4.
 *
 * ── Vi sao phai ve con tro bang tay ────────────────────────────────────────
 * Trinh duyet khong ve con tro chuot vao anh quay duoc: con tro la cua he dieu
 * hanh, khong phai cua trang. Mot video khong co con tro thi cac o nhap tu
 * dung day chu, cac nut tu dung bam — nguoi xem khong theo duoc thao tac nao
 * dan toi ket qua nao. Nen kich ban tiem mot con tro gia vao trang, cho no
 * nghe su kien mousemove that ma Playwright ban ra, roi di chuyen chuot theo
 * tung buoc nho de duong di muot chu khong nhay coc.
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const BASE = process.argv[2] || 'http://localhost';
const ADMIN_PW = process.argv[3] || process.env.ADMIN_PW;
const OUTDIR = process.env.OUTDIR || path.join(ROOT, 'thesis', 'abs');
const CHROME = process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
// Ban ffmpeg di kem Playwright chi co VP8, khong co H.264 — dung no thi khong
// ra duoc .mp4. Uu tien ffmpeg cua he thong; khong co thi bo qua buoc doi va
// giu nguyen .webm.
const FFMPEG = process.env.FFMPEG || '/usr/bin/ffmpeg';
const SHOTS = process.env.SHOTS || path.join(OUTDIR, 'demo-anh');

// Toc do go phim, mili giay moi ky tu. 95ms la khoang toc do mot nguoi go binh
// thuong: du cham de nguoi xem doc kip tung chu, chua cham toi muc sot ruot.
const TOC_DO_GO = Number(process.env.TOC_DO_GO || 95);

if (!ADMIN_PW) {
  console.error('Thieu mat khau quan tri. Xem: docker compose logs api | grep "Mat khau"');
  process.exit(1);
}

const iso = (n) => new Date(Date.now() + 86400000 * n).toISOString().slice(0, 10);
const NEW_PW = 'Demo' + Math.random().toString(36).slice(2, 10) + '!A1';

/**
 * Con tro gia, thanh chu thich, va the tieu de chuong.
 *
 * Cai bang addInitScript nen chung song qua moi lan chuyen trang, va khong
 * phai the <script> noi tuyen nen khong dinh CSP cua nginx.
 */
const LOP_PHU = `
window.__capText = window.__capText || '';

window.__cap = function (t) {
  window.__capText = t;
  let el = document.getElementById('__demo_cap');
  if (!el) {
    el = document.createElement('div');
    el.id = '__demo_cap';
    Object.assign(el.style, {
      position: 'fixed', left: '0', right: '0', bottom: '0', zIndex: '2147483646',
      background: 'rgba(14,92,99,.96)', color: '#fff', padding: '14px 26px',
      font: '600 19px/1.4 system-ui,-apple-system,"Segoe UI",sans-serif',
      letterSpacing: '.01em', boxShadow: '0 -2px 18px rgba(0,0,0,.25)',
      display: 'flex', alignItems: 'center', gap: '14px',
    });
    (document.body || document.documentElement).appendChild(el);
  }
  el.textContent = t;
};

/* The tieu de chuong: phu kin man hinh vai giay de nguoi xem biet sap xem gi. */
window.__chuong = function (so, ten, phu) {
  let el = document.getElementById('__demo_chuong');
  if (!el) {
    el = document.createElement('div');
    el.id = '__demo_chuong';
    Object.assign(el.style, {
      position: 'fixed', inset: '0', zIndex: '2147483647',
      background: 'linear-gradient(135deg,#0E5C63 0%,#0A4348 100%)', color: '#fff',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', gap: '18px', textAlign: 'center',
      font: '400 20px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif',
      transition: 'opacity .5s ease', opacity: '0',
    });
    (document.body || document.documentElement).appendChild(el);
  }
  el.innerHTML =
    '<div style="font-size:15px;letter-spacing:.22em;text-transform:uppercase;opacity:.7">Phần ' + so + '</div>' +
    '<div style="font-size:46px;font-weight:700;letter-spacing:-.01em;max-width:1000px">' + ten + '</div>' +
    '<div style="font-size:21px;opacity:.85;max-width:860px">' + (phu || '') + '</div>';
  el.style.display = 'flex';
  requestAnimationFrame(function () { el.style.opacity = '1'; });
};

window.__tatChuong = function () {
  const el = document.getElementById('__demo_chuong');
  if (!el) return;
  el.style.opacity = '0';
  setTimeout(function () { el.style.display = 'none'; }, 520);
};

/* Con tro gia. Nghe mousemove THAT ma Playwright ban ra, nen duong di cua no
   dung bang duong di cua chuot that — khong phai mot hoat hinh dung san. */
window.__veConTro = function () {
  if (document.getElementById('__demo_tro')) return;
  const tro = document.createElement('div');
  tro.id = '__demo_tro';
  tro.innerHTML =
    '<svg width="26" height="30" viewBox="0 0 26 30" style="display:block;' +
    'filter:drop-shadow(0 2px 4px rgba(0,0,0,.45))">' +
    '<path d="M3 2 L3 22 L8.5 17 L12 25.5 L16 23.8 L12.6 15.6 L20 15.2 Z" ' +
    'fill="#fff" stroke="#111" stroke-width="1.6" stroke-linejoin="round"/></svg>';
  Object.assign(tro.style, {
    position: 'fixed', left: '0', top: '0', zIndex: '2147483645',
    pointerEvents: 'none', willChange: 'transform',
    transform: 'translate(-100px,-100px)',
  });
  (document.body || document.documentElement).appendChild(tro);

  document.addEventListener('mousemove', function (e) {
    tro.style.transform = 'translate(' + e.clientX + 'px,' + e.clientY + 'px)';
  }, true);

  /* Gon song luc bam: nguoi xem thay duoc DA BAM, khong phai doan tu ket qua. */
  document.addEventListener('mousedown', function (e) {
    const song = document.createElement('div');
    Object.assign(song.style, {
      position: 'fixed', left: (e.clientX - 4) + 'px', top: (e.clientY - 4) + 'px',
      width: '8px', height: '8px', borderRadius: '50%', zIndex: '2147483644',
      border: '2px solid #0E5C63', background: 'rgba(14,92,99,.28)',
      pointerEvents: 'none', transition: 'all .45s ease-out',
    });
    (document.body || document.documentElement).appendChild(song);
    requestAnimationFrame(function () {
      song.style.width = '46px'; song.style.height = '46px';
      song.style.left = (e.clientX - 23) + 'px'; song.style.top = (e.clientY - 23) + 'px';
      song.style.opacity = '0';
    });
    setTimeout(function () { song.remove(); }, 520);
  }, true);
};

/* Vien sang quanh o dang duoc thao tac, de mat nguoi xem biet nhin vao dau. */
window.__nhanManh = function (x, y, w, h) {
  const cu = document.getElementById('__demo_nhanmanh');
  if (cu) cu.remove();
  const el = document.createElement('div');
  el.id = '__demo_nhanmanh';
  Object.assign(el.style, {
    position: 'fixed', left: (x - 6) + 'px', top: (y - 6) + 'px',
    width: (w + 12) + 'px', height: (h + 12) + 'px', zIndex: '2147483643',
    border: '2.5px solid #A83E1E', borderRadius: '6px', pointerEvents: 'none',
    boxShadow: '0 0 0 3px rgba(168,62,30,.18)', transition: 'opacity .3s',
  });
  (document.body || document.documentElement).appendChild(el);
};
window.__boNhanManh = function () {
  const el = document.getElementById('__demo_nhanmanh');
  if (el) el.remove();
};

function __dung() {
  window.__veConTro();
  if (window.__capText) window.__cap(window.__capText);
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', __dung);
} else {
  __dung();
}
`;

const log = (s) => console.log('  ' + s);
const boQua = [];

async function main() {
  fs.mkdirSync(OUTDIR, { recursive: true });
  // Xoa het anh cua lan quay truoc. Khong xoa thi anh cu con lai lan vao bo
  // moi: kich ban nay doi ten anh so voi ban truoc, nen nhung tam mang ten cu
  // khong bi ghi de. Nguoi doc thu muc se thay mot bo anh nua cu nua moi, va
  // khong co cach nao biet tam nao thuoc lan quay nao.
  fs.rmSync(SHOTS, { recursive: true, force: true });
  fs.mkdirSync(SHOTS, { recursive: true });
  const videoDir = path.join(OUTDIR, '.video-tmp');
  fs.rmSync(videoDir, { recursive: true, force: true });

  const browser = await chromium.launch({ executablePath: CHROME });
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: 'vi-VN',
    recordVideo: { dir: videoDir, size: { width: 1440, height: 900 } },
  });
  await ctx.addInitScript(LOP_PHU);
  const page = await ctx.newPage();

  // Chuot bat dau o goc duoi, ngoai vung noi dung, de no khong che gi luc mo
  // trang dau tien.
  let chuotX = 720, chuotY = 860;
  await page.mouse.move(chuotX, chuotY);

  let shotNo = 0;
  const batDau = Date.now();

  // ── Tien ich dung chung ────────────────────────────────────────────────

  const doi = (ms) => page.waitForTimeout(ms);

  const cap = async (t, ms = 2400) => {
    await page.evaluate((x) => window.__cap(x), t).catch(() => {});
    await doi(ms);
  };

  const chuong = async (so, ten, phu, ms = 4200) => {
    await page.evaluate(([a, b, c]) => window.__chuong(a, b, c), [so, ten, phu]).catch(() => {});
    await doi(ms);
    await page.evaluate(() => window.__tatChuong()).catch(() => {});
    await doi(700);
    log(`[${phutGiay()}] Phan ${so}: ${ten}`);
  };

  const phutGiay = () => {
    const s = Math.round((Date.now() - batDau) / 1000);
    return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  };

  const shot = async (name) => {
    shotNo += 1;
    await page.screenshot({ path: path.join(SHOTS, `${String(shotNo).padStart(2, '0')}-${name}.png`) });
  };

  const go = async (p, ms = 1400) => {
    await page.goto(BASE + p, { waitUntil: 'networkidle' }).catch(() => {});
    await doi(ms);
    // Chuot ve dung cho cu sau khi chuyen trang: trang moi nap lai lop phu nen
    // con tro gia bat dau o goc, phai ban mot su kien de no nhay ve dung cho.
    await page.mouse.move(chuotX, chuotY);
  };

  /**
   * Di chuot toi giua mot phan tu, theo tung buoc nho.
   *
   * `steps` la thu lam nen duong di muot: Playwright ban ra dung chung ay su
   * kien mousemove trung gian, va con tro gia bam theo tung su kien.
   */
  const toi = async (loc, { steps = 26, nghi = 420 } = {}) => {
    const o = loc.first ? loc.first() : loc;
    await o.scrollIntoViewIfNeeded().catch(() => {});
    await doi(260);
    const h = await o.boundingBox();
    if (!h) throw new Error('khong thay phan tu de di chuot toi');
    const x = Math.round(h.x + h.width / 2);
    const y = Math.round(h.y + h.height / 2);
    await page.mouse.move(x, y, { steps });
    chuotX = x; chuotY = y;
    await doi(nghi);
    return h;
  };

  /** Di toi roi bam, co gon song. */
  const bam = async (loc, { nghi = 900, nhanManh = false } = {}) => {
    const h = await toi(loc);
    if (nhanManh) {
      await page.evaluate(([x, y, w, hh]) => window.__nhanManh(x, y, w, hh),
        [Math.round(h.x), Math.round(h.y), Math.round(h.width), Math.round(h.height)]).catch(() => {});
      await doi(600);
    }
    await page.mouse.down();
    await doi(110);
    await page.mouse.up();
    await doi(nghi);
    if (nhanManh) await page.evaluate(() => window.__boNhanManh()).catch(() => {});
  };

  /**
   * Bam vao o nhap roi GO TUNG KY TU.
   *
   * Khong dung fill(): fill() dat thang gia tri vao o, nen tren video chu hien
   * ra nguyen mot cuc. Nguoi xem khong phan biet duoc "he thong tu dien" voi
   * "co nguoi dang go", va do la khac biet quan trong nhat cua mot video demo.
   */
  const go_chu = async (loc, chu, { xoaTruoc = false, nghi = 700 } = {}) => {
    await bam(loc, { nghi: 320 });
    if (xoaTruoc) {
      await page.keyboard.press('Control+A');
      await doi(200);
      await page.keyboard.press('Backspace');
      await doi(260);
    }
    await page.keyboard.type(chu, { delay: TOC_DO_GO });
    await doi(nghi);
  };

  /** Cuon tu tu, khong nhay mot phat toi cuoi trang. */
  const cuon = async (tong, { buoc = 110, nhip = 70 } = {}) => {
    const n = Math.max(1, Math.round(Math.abs(tong) / buoc));
    const d = tong < 0 ? -buoc : buoc;
    for (let i = 0; i < n; i++) {
      await page.evaluate((y) => window.scrollBy(0, y), d);
      await doi(nhip);
    }
    await doi(500);
  };

  const cuonLenDau = async () => {
    const y = await page.evaluate(() => window.scrollY);
    if (y > 0) await cuon(-y, { buoc: 220, nhip: 40 });
  };

  /**
   * Chay mot doan kich ban, ghi lai neu hong thay vi dung ca buoi quay.
   *
   * Video nay dai muoi lam phut; mot selector lech o phut thu muoi hai ma lam
   * mat ca mi phut truoc do thi khong dang. Nhung bo qua IM LANG con te hon:
   * moi lan bo qua deu duoc ghi lai va in ra cuoi buoi, de nguoi quay biet
   * dung nhung canh nao da thieu.
   */
  const thu = async (ten, fn) => {
    try {
      await fn();
    } catch (e) {
      boQua.push(`${ten} — ${String(e.message || e).split('\n')[0].slice(0, 120)}`);
      log(`  [bo qua] ${ten}`);
      await page.evaluate(() => window.__boNhanManh()).catch(() => {});
      await page.keyboard.press('Escape').catch(() => {});
      await doi(400);
    }
  };

  // ══════════════════════════════════════════════════════════════════════
  // PHAN 1 — Trang khach
  // ══════════════════════════════════════════════════════════════════════
  await go('/');
  await chuong(1, 'Trang của khách',
    'Homestay TVH — Ấp Long Trị, xã Long Đức, TP. Trà Vinh', 4600);

  await cap('Trang chủ: ảnh bìa, thanh tìm phòng, và bốn loại phòng bên dưới.', 3600);
  await shot('trang-chu');
  await cap('Cuộn xuống xem ưu đãi đang chạy và phần giới thiệu.', 1400);
  await cuon(900);
  await cap('Hai banner ưu đãi — do khu quản trị bật tắt, không phải ảnh dán cứng.', 3400);
  await cuon(900);
  await cap('Bốn loại phòng: giá hiển thị là giá thấp nhất cho một đêm.', 3800);
  await shot('bon-loai-phong');
  await cuon(1000);
  await cap('Thư viện ảnh và bài viết, cũng lấy từ cơ sở dữ liệu.', 3400);
  await cuon(1100);
  await cap('Sơ đồ đường đi và thông tin liên hệ ở cuối trang.', 3000);
  await shot('cuoi-trang-chu');
  await cuonLenDau();

  // ── Danh sach phong va chi tiet mot phong ──────────────────────────────
  await thu('mo trang phong', async () => {
    await bam(page.getByRole('link', { name: /^phòng$/i }).first());
    await doi(1800);
  });
  await cap('Danh sách phòng: bốn loại, mỗi loại một thẻ.', 3200);
  await shot('danh-sach-phong');

  await thu('mo chi tiet bungalow', async () => {
    await bam(page.locator('a[href*="/phong/"]').last());
    await doi(2200);
  });
  await cap('Chi tiết phòng: ảnh, mô tả, tiện ích, và giá một đêm.', 3600);
  await cuon(800);
  await cap('Tiện ích hiển thị bằng biểu tượng SVG, không dùng emoji.', 3400);
  await shot('chi-tiet-phong');
  await cuon(900);
  await cap('Đánh giá của khách đã ở — chỉ đánh giá ĐÃ DUYỆT mới hiện ra đây.', 3800);
  await shot('danh-gia-cong-khai');
  await cuonLenDau();

  // ══════════════════════════════════════════════════════════════════════
  // PHAN 2 — Dat phong
  // ══════════════════════════════════════════════════════════════════════
  await chuong(2, 'Khách đặt phòng',
    'Ba bước: chọn ngày, chọn phòng, điền thông tin', 4200);
  await go('/dat-phong');

  await cap('Bước 1 — chọn ngày. Mở lịch ra.', 2000);
  await thu('mo lich', async () => {
    await bam(page.locator('[aria-haspopup=dialog]').first(), { nhanManh: true });
    await doi(1100);
  });

  const soldOut = iso(12);
  await thu('tim thang co ngay het phong', async () => {
    for (let i = 0; i < 6; i++) {
      if (await page.locator(`[data-date="${soldOut}"]`).count()) break;
      await bam(page.getByLabel('Tháng sau'), { nghi: 500 });
    }
  });
  await cap('Ngày hết phòng bị chặn sẵn ngay trong lịch — không bấm chọn được.', 4600);
  await thu('nhan manh ngay bi chan', async () => {
    const o = page.locator(`[data-date="${soldOut}"]`).first();
    const h = await o.boundingBox();
    if (h) {
      await page.evaluate(([x, y, w, hh]) => window.__nhanManh(x, y, w, hh),
        [Math.round(h.x), Math.round(h.y), Math.round(h.width), Math.round(h.height)]);
      await doi(2600);
      await page.evaluate(() => window.__boNhanManh());
    }
  });
  await shot('lich-ngay-bi-chan');

  const d1 = iso(20), d2 = iso(23);
  const chon = async (key) => {
    for (let i = 0; i < 8; i++) {
      const c = page.locator(`[data-date="${key}"]`);
      if (await c.count() && await c.first().isEnabled()) { await bam(c, { nghi: 700 }); return true; }
      await bam(page.getByLabel('Tháng sau'), { nghi: 450 });
    }
    return false;
  };
  await cap('Chọn ngày nhận phòng, rồi ngày trả phòng.', 1800);
  await thu('chon khoang ngay', async () => { await chon(d1); await chon(d2); });
  await page.keyboard.press('Escape').catch(() => {});
  await doi(900);
  await cap('Ba đêm. Số khách để mặc định hai người lớn.', 2600);

  await thu('bam xem phong con trong', async () => {
    await bam(page.getByRole('button', { name: /xem phòng còn trống/i }), { nhanManh: true });
    await doi(2600);
  });

  await cap('Bước 2 — giá ở đây là TỔNG CẢ KỲ ba đêm, không phải giá một đêm.', 4800);
  await shot('chon-phong');
  await thu('chon loai phong', async () => {
    await bam(page.getByRole('button', { name: /^chọn/i }).first(), { nhanManh: true });
    await doi(2000);
  });

  // ── Dien thong tin, go tung ky tu ──────────────────────────────────────
  await cap('Bước 3 — điền thông tin. Không bắt khách tạo tài khoản.', 2800);
  await thu('go ho ten', async () => {
    await go_chu(page.getByLabel(/họ.*tên/i).first(), 'Nguyễn Hoàng Quân');
  });
  await thu('go so dien thoai', async () => {
    await go_chu(page.getByLabel(/điện thoại/i).first(), '0912345678');
  });
  await thu('go email', async () => {
    await go_chu(page.getByLabel(/email/i).first(), 'quan.demo@example.vn');
  });
  await thu('go yeu cau dac biet', async () => {
    await go_chu(page.getByLabel(/yêu cầu/i).first(),
      'Xin phòng tầng trệt, nhà có người lớn tuổi.');
  });
  await cap('Tóm tắt đơn bên phải khớp đúng những gì vừa chọn.', 4000);
  await shot('xac-nhan-don');

  await thu('bam dat phong', async () => {
    await bam(page.getByRole('button', { name: /đặt phòng và chuyển sang thanh toán/i }),
      { nhanManh: true });
    await doi(5200);
  });

  // ══════════════════════════════════════════════════════════════════════
  // PHAN 3 — Thanh toan
  // ══════════════════════════════════════════════════════════════════════
  const code = (page.url().match(/thanh-toan\/([A-Z0-9-]+)/i) || [])[1] || '';
  if (!code) throw new Error('Khong tao duoc don — URL khong co ma don: ' + page.url());
  log('ma don: ' + code);

  await chuong(3, 'Thanh toán giữ chỗ',
    'Mã QR, đồng hồ đếm ngược 15 phút, và nút mô phỏng chuyển khoản', 4200);
  await cap(`Đơn ${code}. Mã QR chuyển khoản sinh theo đúng số tiền cọc.`, 4400);
  await shot('thanh-toan-qr');
  await cap('Đồng hồ đếm ngược 15 phút là thời gian giữ chỗ THẬT — hết giờ đơn tự huỷ.', 4600);
  await cuon(420);
  await cap('Nội dung chuyển khoản có mã đơn, để webhook ghép tiền về đúng đơn.', 4400);

  await cap('Đồ án chưa đăng ký tài khoản SePay thật, nên bản demo có nút này.', 4200);
  await thu('bam nut mo phong', async () => {
    await bam(page.getByRole('button', { name: /mô phỏng đã chuyển khoản/i }), { nhanManh: true });
  });
  await cap('Nút dựng đúng gói tin SePay rồi đẩy qua ĐÚNG webhook thật.', 4000);
  await doi(4000);

  const xacNhan = await page.getByText(/đặt phòng thành công|đã xác nhận/i).count();
  if (!xacNhan) {
    const tt = await page.locator('body').innerText();
    throw new Error('Don khong sang trang thai da xac nhan. Tren man hinh: '
      + tt.replace(/\s+/g, ' ').slice(0, 200));
  }
  await cap('Tiền về — màn hình tự chuyển, khách không phải bấm gì thêm.', 4200);
  await shot('da-xac-nhan');
  await cuon(400);
  await cap('Huy hiệu ĐÃ XÁC NHẬN, tiền cọc đã trả, số còn lại trả tại homestay.', 4600);
  await cuonLenDau();

  // ── Tra cuu don ────────────────────────────────────────────────────────
  await go('/tra-cuu');
  await cap('Khách tra cứu lại đơn bằng mã đơn và số điện thoại — không cần tài khoản.', 3000);
  await thu('go ma don', async () => {
    await go_chu(page.getByLabel(/mã đơn/i).first(), code);
  });
  await thu('go sdt tra cuu', async () => {
    await go_chu(page.getByLabel(/điện thoại/i).first(), '0912345678');
  });
  await thu('bam tra cuu', async () => {
    await bam(page.getByRole('button', { name: /tra cứu|tìm/i }).first(), { nhanManh: true });
    await doi(3000);
  });
  await cap('Đơn hiện đúng trạng thái, kèm phòng được gán và số tiền còn lại.', 4400);
  await shot('tra-cuu-don');

  // ══════════════════════════════════════════════════════════════════════
  // PHAN 4 — Chu homestay dang nhap
  // ══════════════════════════════════════════════════════════════════════
  await chuong(4, 'Chủ homestay đăng nhập',
    'Tài khoản dựng sẵn bắt buộc đổi mật khẩu ở lần đăng nhập đầu', 4200);
  await go('/admin');

  if (await page.locator('input[type=email]').count()) {
    await cap('Đăng nhập khu quản trị bằng tài khoản quản trị.', 2400);
    await thu('go email quan tri', async () => {
      await go_chu(page.locator('input[type=email]').first(), 'admin@tvh.local');
    });
    await thu('go mat khau', async () => {
      await go_chu(page.locator('input[type=password]').first(), ADMIN_PW);
    });
    await shot('dang-nhap');
    await thu('bam dang nhap', async () => {
      await bam(page.getByRole('button', { name: /đăng nhập/i }), { nhanManh: true });
      await doi(4200);
    });
  }

  if (/doi-mat-khau/.test(page.url())) {
    await cap('Mật khẩu tạm chỉ dùng được MỘT lần — hệ thống bắt đổi ngay.', 4200);
    await shot('buoc-doi-mat-khau');
    await thu('doi mat khau', async () => {
      const ps = page.locator('input[type=password]');
      const n = await ps.count();
      await go_chu(ps.nth(0), ADMIN_PW, { nghi: 400 });
      await go_chu(ps.nth(1), NEW_PW, { nghi: 400 });
      if (n > 2) await go_chu(ps.nth(2), NEW_PW, { nghi: 400 });
      await bam(page.getByRole('button', { name: /đổi|lưu|xác nhận|cập nhật/i }).first(),
        { nhanManh: true });
      await doi(4500);
    });
    // Mat khau moi KHONG ghi vao repo. Ghi ra thu muc tam cua he dieu hanh va
    // chi in duong dan, de no khong lot vao git va khong hien ra man hinh.
    const pwFile = path.join(os.tmpdir(), 'homestay-demo-admin.pw');
    fs.writeFileSync(pwFile, NEW_PW, { mode: 0o600 });
    log('mat khau quan tri moi da ghi vao: ' + pwFile);
  }

  await go('/admin');
  // Chot kiem tra: neu mat khau sai thi trang van la form dang nhap, va toan bo
  // nua sau video se la anh chup trang dang nhap — dung kich thuoc tep, trong
  // hop ly, va sai hoan toan. Da dinh mot lan roi nen chan thang o day.
  if (await page.locator('input[type=password]').count()) {
    throw new Error(
      'Chua vao duoc khu quan tri — mat khau sai hoac da bi doi. ' +
      'Dung lai CSDL sach roi lay mat khau moi tu log cua api.');
  }

  // ══════════════════════════════════════════════════════════════════════
  // PHAN 5 — Tong quan
  // ══════════════════════════════════════════════════════════════════════
  await chuong(5, 'Bảng số liệu',
    'Doanh thu, tỉ lệ lấp đầy, tỉ lệ huỷ, hàng chờ đối soát', 4000);
  await cap('Sáu ô số liệu, mỗi ô ghi rõ nó tính theo ngày nào.', 4600);
  await shot('tong-quan');
  await cuon(560);
  await cap('Giá trị booking theo tháng — lấy từ ngày NHẬN PHÒNG, không phải ngày tạo đơn.', 4600);
  await cuon(560);
  await cap('Tỉ lệ lấp đầy theo tháng, tính trên số đêm-phòng đã bán.', 4200);
  await cuon(520);
  await cap('Loại phòng bán chạy — xếp theo số đơn và theo doanh thu.', 4200);
  await shot('tong-quan-bieu-do');
  await cuonLenDau();

  // ══════════════════════════════════════════════════════════════════════
  // PHAN 6 — Don dat phong
  // ══════════════════════════════════════════════════════════════════════
  await chuong(6, 'Xử lý đơn đặt phòng',
    'Lọc, tìm kiếm, xem chi tiết và chuyển trạng thái', 4000);
  await thu('mo danh sach don', async () => {
    await bam(page.getByRole('link', { name: /đơn đặt phòng/i }).first());
    await doi(2600);
  });
  await cap('Hơn ba trăm đơn mẫu, đủ tám trạng thái khác nhau.', 4200);
  await shot('danh-sach-don');

  await cap('Lọc theo trạng thái — ví dụ chỉ xem đơn đang chờ thanh toán.', 2600);
  await thu('loc theo trang thai', async () => {
    const o = page.getByLabel('Trạng thái').first();
    await toi(o);
    await o.selectOption({ label: 'Chờ thanh toán' }).catch(async () => {
      await o.selectOption('PENDING_PAYMENT');
    });
    await doi(2600);
  });
  await cap('Chỉ còn đơn chưa trả tiền — đây là hàng việc của người trực.', 4200);
  await shot('loc-cho-thanh-toan');

  await cap('Tìm thẳng đơn vừa đặt ở phần đầu video.', 2200);
  await thu('go o tim kiem', async () => {
    const o = page.getByLabel('Trạng thái').first();
    await toi(o);
    await o.selectOption('').catch(() => {});
    await doi(1200);
    await go_chu(page.getByLabel(/tìm mã/i).first(), code);
    await doi(2600);
  });
  await cap(`Đơn ${code} — chính là đơn khách vừa đặt và vừa trả cọc.`, 4200);
  await shot('tim-dung-don');

  await thu('mo chi tiet don', async () => {
    await bam(page.locator('table tbody a').first(), { nhanManh: true });
    await doi(2800);
  });
  await cap('Chi tiết đơn: thông tin khách, tiền, và phòng được gán.', 4400);
  await shot('chi-tiet-don');
  await cuon(520);
  await cap('Dòng thời gian trạng thái — mỗi lần chuyển đều có vết, không sửa được.', 4600);
  await cuon(520);
  await cap('Thanh toán và hộp thư đi: thư xác nhận đã vào hàng đợi gửi.', 4600);
  await shot('hop-thu-di');
  await cuon(520);
  await cap('Ghi chú nội bộ — chỉ người trực đọc, khách không thấy.', 3600);

  await cap('Khách tới nơi, người trực chuyển đơn sang ĐÃ NHẬN PHÒNG.', 3000);
  await thu('chuyen trang thai don', async () => {
    const o = page.getByLabel('Chuyển sang').first();
    await toi(o);
    await o.selectOption('CHECKED_IN').catch(async () => {
      await o.selectOption({ label: /nhận phòng/i });
    });
    await doi(1200);
    await go_chu(page.getByLabel(/ghi chú/i).first(),
      'Khách tới lúc 14h20, đã giao chìa khoá phòng B01.');
    await bam(page.getByRole('button', { name: /thực hiện/i }).first(), { nhanManh: true });
    await doi(3200);
  });
  await cap('Trạng thái đổi ngay, và dòng thời gian có thêm một vết mới.', 4400);
  await shot('da-nhan-phong');
  await cuonLenDau();

  // ══════════════════════════════════════════════════════════════════════
  // PHAN 7 — Doi soat thanh toan
  // ══════════════════════════════════════════════════════════════════════
  await chuong(7, 'Đối soát thanh toán',
    'Khoản thiếu tiền chờ khách bù, khoản thừa tiền phải hoàn lại', 4200);
  await go('/admin/payments', 2200);
  await cap('Năm khoản lệch tiền đang chờ người xử lý — con số này hiện cả ở thanh bên.', 4600);
  await shot('doi-soat');
  await cap('CẦN XEM XÉT: khách chuyển thiếu. CẦN HOÀN TIỀN: khách chuyển thừa.', 4800);
  await cuon(600);
  await cap('Người trực ghi lại đã làm gì với khoản này.', 2600);
  await thu('ghi chu doi soat', async () => {
    await go_chu(page.getByLabel(/ghi chú đối soát/i).first(),
      'Đã gọi khách, khách chuyển bù phần còn thiếu trong hôm nay.');
    await bam(page.getByRole('button', { name: /đánh dấu đã xử lý/i }).first(),
      { nhanManh: true });
    await doi(3000);
  });
  await cap('Khoản đã xử lý rời khỏi hàng chờ — số đếm giảm đi một.', 4200);
  await shot('doi-soat-da-xu-ly');
  await cuonLenDau();

  // ══════════════════════════════════════════════════════════════════════
  // PHAN 8 — Loai phong va phong
  // ══════════════════════════════════════════════════════════════════════
  await chuong(8, 'Quản lý phòng',
    'Loại phòng, phòng vật lý, và khoảng ngày đóng phòng', 4000);
  await go('/admin/room-types', 2200);
  await cap('Bốn loại phòng. Mỗi loại có giá, sức chứa, và danh sách tiện ích.', 4400);
  await shot('loai-phong');
  await cuon(560);
  await cap('Tiện ích gắn vào loại phòng bằng ô tick — chúng hiện ngay ở trang khách.', 4400);
  await cuonLenDau();

  await go('/admin/rooms', 2200);
  await cap('Mười lăm phòng vật lý. Phòng 105 đang BẢO TRÌ nên không bán được.', 4600);
  await shot('danh-sach-phong-vat-ly');

  await cap('Thêm một phòng mới cho loại Standard.', 2600);
  await thu('them phong moi', async () => {
    await go_chu(page.getByLabel('Số phòng').first(), '106');
    await go_chu(page.getByLabel('Tầng').first(), '1');
    await bam(page.getByRole('button', { name: /^thêm$/i }).first(), { nhanManh: true });
    await doi(2800);
  });
  await cap('Phòng 106 vào danh sách ngay, và tính luôn vào số phòng còn trống.', 4200);
  await shot('da-them-phong');

  await cap('Đóng phòng theo khoảng ngày — ví dụ sơn lại phòng.', 2800);
  await thu('xem khoang dong phong', async () => {
    await page.evaluate(() => {
      const h = [...document.querySelectorAll('h2,h3')]
        .find((x) => /ngày không nhận khách|ngày khả dụng|đóng phòng/i.test(x.textContent));
      if (h) window.scrollBy(0, h.getBoundingClientRect().top - 90);
    });
    await doi(1600);
  });
  await cap('Hệ thống tự mở lại phòng khi khoảng đóng đã qua — không ai phải nhớ bật.', 4800);
  await shot('ngay-kha-dung');
  await cuonLenDau();

  // ══════════════════════════════════════════════════════════════════════
  // PHAN 9 — Khuyen mai
  // ══════════════════════════════════════════════════════════════════════
  await chuong(9, 'Khuyến mãi',
    'Còn hạn, hết hạn, hết lượt, và đã tắt — bốn cách một mã ngừng hiệu lực', 4400);
  await go('/admin/promotions', 2200);
  await cap('Sáu mã. Mỗi mã ngừng hiệu lực vì một lý do khác nhau.', 4600);
  await shot('khuyen-mai');

  await cap('Tạo một mã mới cho mùa thấp điểm.', 2600);
  await thu('them ma khuyen mai', async () => {
    await bam(page.getByRole('button', { name: /thêm mã/i }).first(), { nhanManh: true });
    await doi(1400);
    await go_chu(page.getByLabel(/^mã$/i).first(), 'THAPDIEM12');
    await go_chu(page.getByLabel(/tên chiến dịch/i).first(), 'Mùa thấp điểm');
    await go_chu(page.getByLabel(/giá trị giảm/i).first(), '12', { xoaTruoc: true });
    await go_chu(page.getByLabel(/số đêm tối thiểu/i).first(), '2', { xoaTruoc: true });
    await doi(900);
  });
  await cap('Mã giảm 12% cho đơn từ hai đêm trở lên.', 3600);
  await shot('them-khuyen-mai');
  await thu('luu ma khuyen mai', async () => {
    await bam(page.getByRole('button', { name: /^lưu$|^thêm$|^tạo$/i }).first(), { nhanManh: true });
    await doi(2800);
  });
  await cuonLenDau();

  // ══════════════════════════════════════════════════════════════════════
  // PHAN 10 — Kiem duyet danh gia
  // ══════════════════════════════════════════════════════════════════════
  await chuong(10, 'Kiểm duyệt đánh giá',
    'Đánh giá chỉ hiện ở trang khách sau khi được duyệt', 4200);
  await go('/admin/reviews', 2200);
  await cap('Hai tư đánh giá: đã duyệt, chờ duyệt, và đã từ chối.', 4400);
  await shot('danh-gia-quan-tri');

  await cap('Lọc riêng những đánh giá đang chờ duyệt.', 2600);
  await thu('loc danh gia cho duyet', async () => {
    const o = page.getByLabel('Trạng thái').first();
    await toi(o);
    await o.selectOption('PENDING').catch(async () => {
      await o.selectOption({ label: /chờ duyệt/i });
    });
    await doi(2600);
  });
  await cap('Bốn bài chờ duyệt — trong đó có một bài rao vặt cần từ chối.', 4600);
  await shot('danh-gia-cho-duyet');

  await cap('Trả lời khách rồi duyệt bài đánh giá tốt.', 2800);
  await thu('tra loi va duyet', async () => {
    await go_chu(page.getByLabel(/trả lời khách/i).first(),
      'Cảm ơn anh chị đã dành thời gian viết. Hẹn gặp lại mùa sau!');
    await bam(page.getByRole('button', { name: /gửi trả lời/i }).first(), { nhanManh: true });
    await doi(2400);
    await bam(page.getByRole('button', { name: /^duyệt$/i }).first(), { nhanManh: true });
    await doi(2800);
  });
  await cap('Bài đã duyệt rời khỏi hàng chờ và xuất hiện ở trang khách.', 4400);
  await shot('da-duyet-danh-gia');
  await cuonLenDau();

  // ══════════════════════════════════════════════════════════════════════
  // PHAN 11 — Noi dung trang chu
  // ══════════════════════════════════════════════════════════════════════
  await chuong(11, 'Nội dung trang chủ',
    'Chữ trên trang khách sửa được từ khu quản trị, không phải sửa mã nguồn', 4600);
  await go('/admin/content/sections', 2200);
  await cap('Bốn khối nội dung: ảnh bìa, giới thiệu, liên hệ, đường đi.', 4400);
  await shot('noi-dung-trang-chu');

  await cap('Sửa dòng phụ đề của ảnh bìa.', 2600);
  await thu('sua phu de hero', async () => {
    const o = page.getByLabel(/phụ đề|subtitle/i).first();
    await go_chu(o, 'Nghỉ ngơi giữa miền Tây sông nước', { xoaTruoc: true });
    await bam(page.getByRole('button', { name: /lưu|cập nhật/i }).first(), { nhanManh: true });
    await doi(2600);
  });
  await shot('da-sua-noi-dung');

  await go('/admin/content/banners', 2200);
  await cap('Banner: bật tắt theo khoảng ngày, hết hạn thì tự ẩn khỏi trang khách.', 4600);
  await shot('banner');

  await go('/admin/content/gallery', 2200);
  await cap('Thư viện ảnh, chia theo nhóm: không gian, ẩm thực, trải nghiệm.', 4400);
  await shot('thu-vien-anh');

  await go('/admin/content/posts', 2200);
  await cap('Tin tức: bảy bài, trong đó một bản nháp chưa đăng.', 4400);
  await shot('tin-tuc-quan-tri');
  await cuonLenDau();

  // ══════════════════════════════════════════════════════════════════════
  // PHAN 12 — Quay lai trang khach
  // ══════════════════════════════════════════════════════════════════════
  await chuong(12, 'Thay đổi có hiệu lực ngay',
    'Quay lại trang khách để đối chiếu', 4200);
  await go('/', 2600);
  await cap('Trang khách đọc cùng một cơ sở dữ liệu — không có bước xuất bản nào ở giữa.', 5000);
  await cuon(700);
  await shot('ket-trang-chu');

  await go('/tin-tuc', 2200);
  await cap('Sáu bài đã đăng. Bản nháp không lọt ra ngoài.', 4400);
  await shot('ket-tin-tuc');

  await cap('Hết phần trình diễn. Toàn bộ chạy trên bản đóng gói docker compose.', 5000);

  await ctx.close();
  await browser.close();

  // ── Xuat video ─────────────────────────────────────────────────────────
  const webm = fs.readdirSync(videoDir).find((f) => f.endsWith('.webm'));
  const src = path.join(videoDir, webm);
  const outWebm = path.join(OUTDIR, 'demo-homestay-tvh.webm');
  let outMp4 = null;
  if (fs.existsSync(FFMPEG)) {
    const target = path.join(OUTDIR, 'demo-homestay-tvh.mp4');
    try {
      execFileSync(FFMPEG, ['-y', '-loglevel', 'error', '-i', src,
        '-c:v', 'libx264', '-preset', 'slow', '-crf', '28',
        '-pix_fmt', 'yuv420p', '-movflags', '+faststart', target], { stdio: 'ignore' });
      outMp4 = target;
    } catch {
      fs.copyFileSync(src, outWebm);
      log('khong doi duoc sang .mp4 (ffmpeg thieu bo ma hoa H.264) — giu ban .webm');
    }
  } else {
    fs.copyFileSync(src, outWebm);
    log('khong thay ffmpeg — giu ban .webm');
  }
  fs.rmSync(videoDir, { recursive: true, force: true });

  log(`ma don da dat: ${code}`);
  for (const f of [outMp4 || outWebm].filter(Boolean)) {
    log(`${f}  ${(fs.statSync(f).size / 1024 / 1024).toFixed(1)} MB`);
  }
  log(`${shotNo} anh o ${SHOTS}`);
  log(`tong thoi luong kich ban: ${phutGiay()}`);

  if (boQua.length) {
    console.log('\n  CAC CANH DA BO QUA (' + boQua.length + '):');
    for (const b of boQua) console.log('    - ' + b);
  } else {
    console.log('\n  Khong bo qua canh nao.');
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
