#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Vẽ sơ đồ đường vào homestay: frontend/public/images/demo/map.svg.

Vì sao riêng tấm này vẫn là hình vẽ trong khi 25 tấm còn lại đã thành ảnh
chụp: sơ đồ đường đi KHÔNG phải một cảnh có thật để chụp. Nó là lược đồ —
đường lớn, đường nhánh, khúc sông, cái nhà và một chấm đánh dấu — và việc của
nó là chỉ đường, không phải tả cảnh. Một tấm ảnh chụp từ trên cao vẫn không
nói được "rẽ phải ở đây".

Không vẽ chữ vào tệp: tên đường và chỉ dẫn đã nằm trong phần `body` của mục
`map` ở dữ liệu mẫu, dưới dạng chữ thật mà trình đọc màn hình đọc được và
người dùng phóng to được.

Chạy:  python3 scripts/ve-ban-do.py
"""
import os

RA = os.path.join(os.path.dirname(__file__), '..', 'frontend', 'public', 'images', 'demo')

# Lấy tinh thần từ token nhưng KHÔNG phải cùng một giá trị: token là màu của
# giao diện (phải đạt ngưỡng tương phản với chữ), còn đây là màu của cảnh vật.
NUOC_TREN, NUOC_DUOI = '#2E757A', '#12484F'
LA_VUA    = '#3C7A5F'
GO_SANG   = '#8A6240'
GO_TOI    = '#5C3E29'
MAI       = '#6B4A32'
TUONG     = '#F6EADA'
SAN       = '#DCC9AE'
GACH      = '#A83E1E'
XANH      = '#0E5C63'


def tep(ten, w, h, nhan, than):
    """Ghi một tệp SVG. Không vẽ chữ vào ảnh — xem README trong thư mục này."""
    noi_dung = (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" '
        f'width="{w}" height="{h}" role="img" aria-label="{nhan}">\n'
        f'{than}\n</svg>\n'
    )
    with open(os.path.join(RA, ten), 'w', encoding='utf-8') as f:
        f.write(noi_dung)


def dai_mau(id_, tren, duoi):
    return (f'<linearGradient id="{id_}" x1="0" y1="0" x2="0" y2="1">'
            f'<stop offset="0" stop-color="{tren}"/>'
            f'<stop offset="1" stop-color="{duoi}"/></linearGradient>')


def cay_la(x, y, r, mau=LA_VUA):
    """Cây tán tròn, ba khối lệch nhau cho đỡ tròn trịa như quả bóng."""
    return (f'<g fill="{mau}">'
            f'<rect x="{x-r*0.09:.0f}" y="{y}" width="{r*0.18:.0f}" height="{r*0.95:.0f}" fill="{GO_TOI}"/>'
            f'<circle cx="{x}" cy="{y-r*0.15:.0f}" r="{r}"/>'
            f'<circle cx="{x-r*0.62:.0f}" cy="{y+r*0.12:.0f}" r="{r*0.68:.0f}"/>'
            f'<circle cx="{x+r*0.6:.0f}" cy="{y+r*0.05:.0f}" r="{r*0.6:.0f}"/></g>')


def nha_san(x, y_mai, w, h_than):
    """Nhà sàn mái lá: mái dốc, hai mảng sáng–tối để mái có khối."""
    dinh_x, dinh_y = x + w/2, y_mai - w*0.36
    y_than = y_mai
    return (
        f'<polygon points="{x-w*0.07:.0f},{y_mai} {dinh_x:.0f},{dinh_y:.0f} {x+w*1.07:.0f},{y_mai}" fill="{MAI}"/>'
        f'<polygon points="{x-w*0.07:.0f},{y_mai} {dinh_x:.0f},{dinh_y:.0f} {dinh_x:.0f},{y_mai}" fill="{GO_SANG}"/>'
        f'<rect x="{x}" y="{y_than}" width="{w}" height="{h_than}" fill="{TUONG}"/>'
        f'<rect x="{x}" y="{y_than}" width="{w}" height="{h_than}" fill="none" stroke="{MAI}" stroke-width="{w*0.018:.1f}"/>'
        f'<rect x="{x+w*0.12:.0f}" y="{y_than+h_than*0.22:.0f}" width="{w*0.24:.0f}" height="{h_than*0.44:.0f}" fill="{XANH}"/>'
        f'<rect x="{x+w*0.64:.0f}" y="{y_than+h_than*0.22:.0f}" width="{w*0.24:.0f}" height="{h_than*0.44:.0f}" fill="{XANH}"/>'
        f'<rect x="{x+w*0.06:.0f}" y="{y_than+h_than:.0f}" width="{w*0.05:.0f}" height="{h_than*0.34:.0f}" fill="{GO_TOI}"/>'
        f'<rect x="{x+w*0.89:.0f}" y="{y_than+h_than:.0f}" width="{w*0.05:.0f}" height="{h_than*0.34:.0f}" fill="{GO_TOI}"/>'
    )


def ve_ban_do():
    W, H = 800, 600
    than = (f'<rect width="{W}" height="{H}" fill="{TUONG}"/>'
            + f'<defs>{dai_mau("nuoc", NUOC_TREN, NUOC_DUOI)}</defs>'
            # sông chạy dọc mép dưới, homestay nằm TRÊN BỜ chứ không dưới nước
            + f'<path d="M0 520 Q220 486 430 520 T800 504 L800 600 L0 600Z" fill="url(#nuoc)" opacity=".9"/>'
            # đường lớn nằm ngang phía trên
            + f'<rect y="104" width="{W}" height="54" fill="{SAN}"/>'
            + ''.join(f'<line x1="{x}" y1="131" x2="{x+34}" y2="131" stroke="{TUONG}" stroke-width="5"/>'
                      for x in range(20, W, 76))
            # đường nhánh nối thẳng từ đường lớn xuống tới homestay
            + f'<path d="M540 158 L540 300 Q540 372 452 400" stroke="{SAN}" stroke-width="42" '
            f'fill="none" stroke-linecap="round"/>'
            + cay_la(150, 300, 62) + cay_la(690, 320, 54) + cay_la(250, 430, 44)
            + nha_san(330, 372, 160, 74)
            + f'<circle cx="410" cy="330" r="26" fill="{GACH}"/>'
            + f'<circle cx="410" cy="330" r="9" fill="{TUONG}"/>')
    tep('map.svg', W, H, 'Đường vào homestay', than)


if __name__ == '__main__':
    ve_ban_do()
    duong = os.path.join(RA, 'map.svg')
    print(f'da ve map.svg, {os.path.getsize(duong)/1024:.1f} KB')
