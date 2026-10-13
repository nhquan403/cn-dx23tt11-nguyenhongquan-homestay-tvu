/**
 * Vẽ hình của báo cáo bằng SVG viết tay, rồi chụp ra PNG bằng Chromium.
 *
 * Vì sao viết tay thay vì dùng Mermaid như các hình còn lại: Mermaid tự chọn
 * bố cục, và với sơ đồ quy trình thủ công nó xếp thành một cột dọc cao 3993
 * điểm ảnh. Đưa vào khổ A4 thì hình đó cao 18cm — gần trọn một trang — và nó
 * đẩy Hình 1.1 sang trang trước, để lại trang đó chỉ còn bảy dòng chữ. Hai
 * trang giấy cho một sơ đồ chín ô là cái giá quá đắt.
 *
 * Viết tay thì khổ hình là thứ mình đặt trước chứ không phải thứ nhận được:
 * khung 1500x690 đơn vị, mỗi đơn vị 0,01cm khi in ở bề ngang 15cm, nên hình
 * cao đúng 6,9cm. Cỡ chữ 30 đơn vị = 0,30cm ≈ 8,5pt — vẫn đọc được khi in.
 *
 * Chạy:  node scripts/ve-hinh-bao-cao.mjs
 */
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require_ = createRequire('/opt/node-tools/');
const { chromium } = require_('playwright');

const GOC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RA = path.join(GOC, 'docs', 'images', 'bao-cao');

// Màu lấy đúng theo bảng màu của các hình Mermaid đã có, để quyển báo cáo
// không có một tấm lạc tông.
const NEN_XAM = '#ECECEC', VIEN_XAM = '#BFBFBF';
const NEN_CAM = '#FDF0DC', VIEN_CAM = '#C07A1E';
const NEN_DO = '#FADBD8', VIEN_DO = '#C0392B';
const NET = '#595959', NET_MO = '#A6A6A6';
const CHU = '#1A1A1A', CHU_DO = '#9B2D20';

const FONT = "'Liberation Serif','Times New Roman',serif";
const CO_CHU = 30, CAO_DONG = 36;
const CO_NHO = 25, CAO_DONG_NHO = 30;

/** Một ô chữ nhật có chữ xếp giữa. */
function o(x, y, w, h, dong, { nen = NEN_XAM, vien = VIEN_XAM, co = CO_CHU,
  lh = CAO_DONG, mauChu = CHU, dam = null } = {}) {
  const cx = x + w / 2;
  const tong = dong.length * lh;
  let y0 = y + h / 2 - tong / 2 + lh * 0.72;
  let chu = '';
  dong.forEach((d, i) => {
    const inDam = dam !== null && i === dam;
    chu += `<text x="${cx}" y="${(y0 + i * lh).toFixed(1)}" text-anchor="middle" `
      + `font-family="${FONT}" font-size="${co}" fill="${inDam ? CHU_DO : mauChu}"`
      + `${inDam ? ' font-weight="bold"' : ''}>${d}</text>\n`;
  });
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" `
    + `fill="${nen}" stroke="${vien}" stroke-width="3"/>\n${chu}`;
}

/** Ô quyết định hình thoi. */
function thoi(cx, cy, nw, nh, dong) {
  const tong = dong.length * CAO_DONG;
  let y0 = cy - tong / 2 + CAO_DONG * 0.72;
  let chu = '';
  dong.forEach((d, i) => {
    chu += `<text x="${cx}" y="${(y0 + i * CAO_DONG).toFixed(1)}" text-anchor="middle" `
      + `font-family="${FONT}" font-size="${CO_CHU}" fill="${CHU}">${d}</text>\n`;
  });
  return `<polygon points="${cx},${cy - nh} ${cx + nw},${cy} ${cx},${cy + nh} ${cx - nw},${cy}" `
    + `fill="${NEN_CAM}" stroke="${VIEN_CAM}" stroke-width="3"/>\n${chu}`;
}

/** Ô rủi ro: nhãn đỏ ở dòng đầu, lời giải thích ở các dòng sau. */
function ruiRo(x, y, w, h, nhan, dong) {
  return o(x, y, w, h, [nhan, ...dong],
    { nen: NEN_DO, vien: VIEN_DO, co: CO_NHO, lh: CAO_DONG_NHO, dam: 0 });
}

const duong = (d, { net = NET, cham = false, mui = true } = {}) =>
  `<path d="${d}" fill="none" stroke="${net}" stroke-width="3"`
  + `${cham ? ' stroke-dasharray="9 7"' : ''}`
  + `${mui ? ` marker-end="url(#mui${cham ? '-mo' : ''})"` : ''}/>\n`;

const nhan = (x, y, s, co = CO_NHO) =>
  `<text x="${x}" y="${y}" text-anchor="middle" font-family="${FONT}" `
  + `font-size="${co}" fill="${CHU}">${s}</text>\n`;

/* ---------------------------------------------------------------- Hình 1.2 */
// Bố cục rắn bò: hàng trên chạy từ trái sang phải, thả xuống ở mép phải, hàng
// dưới chạy ngược lại. Đổi một sơ đồ chín ô từ một cột dọc thành hai hàng
// ngang là cách duy nhất giữ được cả chữ đọc được lẫn khổ hình vừa trang.
function quyTrinhThuCong() {
  const W = 1500, H = 715;
  let s = '';

  // Dải rủi ro trên cùng
  s += ruiRo(390, 15, 380, 110, 'RỦI RO 1', ['Tra cứu bằng trí nhớ']);
  s += ruiRo(830, 15, 380, 110, 'RỦI RO 2', ['Hai khách nhắn cùng lúc,',
    'cùng được trả lời còn phòng']);

  // Hàng trên: trái sang phải
  s += o(20, 185, 330, 130, ['Khách nhắn tin hỏi', 'phòng qua mạng xã hội']);
  s += thoi(580, 250, 190, 80, ['Chủ nhà tra lịch bằng', 'TRÍ NHỚ hoặc sổ giấy']);
  s += o(890, 185, 320, 130, ['Chủ nhà trả lời', 'phụ thuộc giờ giấc']);
  s += o(1260, 185, 220, 130, ['Chủ nhà', 'tính nhẩm', 'báo giá']);

  // Nhánh hết phòng
  s += o(485, 355, 190, 80, ['Từ chối']);

  // Hàng dưới: phải sang trái
  s += o(1150, 455, 330, 130, ['Khách chuyển khoản,', 'gửi ảnh biên lai']);
  s += o(780, 455, 330, 130, ['Chủ nhà đối chiếu', 'sao kê BẰNG MẮT']);
  s += o(410, 455, 330, 130, ['Xác nhận qua tin nhắn,', 'không có bản ghi khác']);
  s += o(60, 455, 320, 130, ['Ghi vào sổ giấy'],
    { nen: NEN_CAM, vien: '#E8B974' });

  // Rủi ro cuối, nằm dưới ô cuối cùng
  s += ruiRo(60, 615, 420, 85, 'RỦI RO 3',
    ['Không có bản ghi tập trung,', 'mất sổ là mất hết']);

  // Mũi tên hàng trên
  s += duong('M 350 250 L 384 250');
  s += duong('M 770 250 L 884 250');
  s += nhan(827, 232, 'còn phòng');
  s += duong('M 1210 250 L 1254 250');

  // Nhánh hết phòng: xuống rồi rẽ trái
  s += duong('M 580 330 L 580 351');
  s += nhan(650, 348, 'hết phòng');

  // Thả từ hàng trên xuống hàng dưới ở mép phải
  s += duong('M 1370 315 L 1370 449');

  // Mũi tên hàng dưới, chạy ngược
  s += duong('M 1150 520 L 1116 520');
  s += duong('M 780 520 L 746 520');
  s += duong('M 410 520 L 386 520');

  // Nét đứt nối rủi ro vào đúng bước sinh ra nó
  s += duong('M 580 125 L 580 170', { net: NET_MO, cham: true });
  s += duong('M 1020 125 L 1020 185', { net: NET_MO, cham: true });
  s += duong('M 270 613 L 270 589', { net: NET_MO, cham: true });

  const mui = (id, mau) => `<marker id="${id}" viewBox="0 0 10 10" refX="9" refY="5" `
    + `markerWidth="5" markerHeight="5" orient="auto-start-reverse">`
    + `<path d="M 0 0 L 10 5 L 0 10 z" fill="${mau}"/></marker>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" `
    + `width="${W}" height="${H}" role="img" `
    + `aria-label="Quy trình đặt phòng thủ công qua tin nhắn và ba rủi ro của nó">\n`
    + `<defs>${mui('mui', NET)}${mui('mui-mo', NET_MO)}</defs>\n`
    + `<rect width="${W}" height="${H}" fill="#FFFFFF"/>\n${s}</svg>\n`;
}

/* ---------------------------------------------------------------- Hình 3.1 */
// Bản Mermaid cũ dựng 1320x2415: xếp tám ô use case thành một cột dọc duy
// nhất. In ra ở bề ngang 8,5cm thì chữ bé, mà cao tới 15,6cm. Nặng hơn lỗi
// khổ hình là lỗi nội dung — Bảng 3.2 kê MƯỜI MỘT use case, bản cũ chỉ vẽ
// tám, thiếu UC9, UC10, UC11 và thiếu luôn tác nhân Khách đã trả phòng.
//
// Bản này vẽ đủ mười một, chia hai cột theo tác nhân: cột trái của khách,
// cột phải của quản trị viên. Nhờ chia vậy mà gần như không có đường cắt
// nhau. Quan hệ kế thừa giữa Khách có tài khoản và Khách vãng lai thay cho
// bốn đường liên kết trùng — đúng như Bảng 3.1 mô tả.
function bieuDoUseCase() {
  const W = 1500, H = 760;
  let s = '';

  const COT1 = 520, COT2 = 990, RX1 = 215, RX2 = 220, RY = 46;
  const HANG = [170, 274, 378, 482, 586, 690];

  /** Ô use case hình bầu dục. */
  const uc = (cx, cy, rx, dong) => {
    const lh = 32;
    let y0 = cy - (dong.length * lh) / 2 + lh * 0.72;
    let t = '';
    dong.forEach((d, i) => {
      t += `<text x="${cx}" y="${(y0 + i * lh).toFixed(1)}" text-anchor="middle" `
        + `font-family="${FONT}" font-size="26" fill="${CHU}">${d}</text>\n`;
    });
    return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${RY}" fill="${NEN_XAM}" `
      + `stroke="${VIEN_XAM}" stroke-width="3"/>\n${t}`;
  };

  /** Tác nhân vẽ theo hình người que của UML. */
  const tacNhan = (cx, cy, dong) => {
    let t = '';
    dong.forEach((d, i) => {
      t += `<text x="${cx}" y="${cy + 77 + i * 30}" text-anchor="middle" `
        + `font-family="${FONT}" font-size="26" fill="${CHU}">${d}</text>\n`;
    });
    return `<circle cx="${cx}" cy="${cy - 35}" r="16" fill="none" stroke="${NET}" stroke-width="3"/>\n`
      + `<path d="M ${cx} ${cy - 19} L ${cx} ${cy + 15} M ${cx - 24} ${cy - 4} L ${cx + 24} ${cy - 4} `
      + `M ${cx} ${cy + 15} L ${cx - 20} ${cy + 45} M ${cx} ${cy + 15} L ${cx + 20} ${cy + 45}" `
      + `fill="none" stroke="${NET}" stroke-width="3"/>\n${t}`;
  };

  const lien = (x1, y1, x2, y2) =>
    `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${NET}" stroke-width="2.5"/>\n`;

  // Khung hệ thống
  s += `<rect x="275" y="55" width="965" height="695" rx="8" fill="none" `
    + `stroke="${VIEN_CAM}" stroke-width="3"/>\n`;
  s += `<text x="757" y="98" text-anchor="middle" font-family="${FONT}" `
    + `font-size="30" font-weight="bold" fill="${CHU}">Hệ thống đặt phòng Homestay TVH</text>\n`;

  // Cột trái: use case của khách
  s += uc(COT1, HANG[0], RX1, ['UC1 Tìm phòng trống']);
  s += uc(COT1, HANG[1], RX1, ['UC2 Đặt phòng']);
  s += uc(COT1, HANG[2], RX1, ['UC3 Thanh toán cọc']);
  s += uc(COT1, HANG[3], RX1, ['UC5 Tra cứu và huỷ đơn']);
  s += uc(COT1, HANG[4], RX1, ['UC7 Xem lại toàn bộ', 'đơn đã đặt']);
  s += uc(COT1, HANG[5], RX1, ['UC11 Viết đánh giá']);

  // Cột phải: use case của quản trị viên
  s += uc(COT2, HANG[0], RX2, ['UC4 Đối soát thanh toán']);
  s += uc(COT2, HANG[1], RX2, ['UC6 Quản lý đơn đặt phòng']);
  s += uc(COT2, HANG[2], RX2, ['UC8 Xem báo cáo doanh thu']);
  s += uc(COT2, HANG[3], RX2, ['UC9 Đặt ngày khả dụng', 'của phòng']);
  s += uc(COT2, HANG[4], RX2, ['UC10 Soạn nội dung', 'trang chủ']);

  // Liên kết của khách vãng lai — bốn use case dùng chung
  [0, 1, 2, 3].forEach((i) => { s += lien(165, 200, 305, HANG[i]); });
  // Khách có tài khoản chỉ thêm UC7; phần còn lại thừa hưởng qua quan hệ kế thừa
  s += lien(165, 425, 305, HANG[4]);
  s += lien(165, 630, 305, HANG[5]);
  // Quản trị viên
  [0, 1, 2, 3, 4].forEach((i) => { s += lien(1305, 380, 1210, HANG[i]); });

  // Tác nhân
  s += tacNhan(110, 200, ['Khách', 'vãng lai']);
  s += tacNhan(110, 425, ['Khách có', 'tài khoản']);
  s += tacNhan(110, 630, ['Khách đã', 'trả phòng']);
  s += tacNhan(1360, 380, ['Quản trị viên']);

  // Quan hệ kế thừa: mũi tên tam giác rỗng trỏ về tác nhân tổng quát hơn
  s += `<line x1="110" y1="374" x2="110" y2="330" stroke="${NET}" stroke-width="2.5" `
    + `marker-end="url(#ke-thua)"/>\n`;

  const mui = `<marker id="ke-thua" viewBox="0 0 12 12" refX="11" refY="6" markerWidth="9" `
    + `markerHeight="9" orient="auto"><path d="M 0 0 L 12 6 L 0 12 z" fill="#FFFFFF" `
    + `stroke="${NET}" stroke-width="1.5"/></marker>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" `
    + `width="${W}" height="${H}" role="img" `
    + `aria-label="Biểu đồ use case tổng quát với bốn tác nhân và mười một use case">\n`
    + `<defs>${mui}</defs>\n<rect width="${W}" height="${H}" fill="#FFFFFF"/>\n${s}</svg>\n`;
}

/* -------------------------------------------------------------------- chạy */
const HINH = [
  { ten: 'hinh-1-2-quy-trinh-thu-cong', ve: quyTrinhThuCong },
  { ten: 'hinh-3-1-use-case', ve: bieuDoUseCase },
];

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
// Gấp bốn lần để in A4 không rỗ, giống các ảnh chụp màn hình trong báo cáo.
const ctx = await browser.newContext({ deviceScaleFactor: 4 });
const page = await ctx.newPage();

for (const { ten, ve } of HINH) {
  const svg = ve();
  const tam = path.join(RA, ten + '.svg');
  fs.writeFileSync(tam, svg, 'utf8');
  await page.goto('file://' + tam);
  const khung = await page.locator('svg').boundingBox();
  await page.setViewportSize({ width: Math.ceil(khung.width), height: Math.ceil(khung.height) });
  await page.screenshot({ path: path.join(RA, ten + '.png'), clip: { x: 0, y: 0, ...khung } });
  fs.unlinkSync(tam);
  console.log(`  ${ten}.png  ${Math.round(khung.width)}x${Math.round(khung.height)} don vi`);
}

await browser.close();
console.log('xong');
