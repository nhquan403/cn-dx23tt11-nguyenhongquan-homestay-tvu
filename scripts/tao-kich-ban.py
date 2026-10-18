# -*- coding: utf-8 -*-
"""Sinh kich ban noi khi bao ve tu ghi chu cua tung slide.

Ghi chu nam o scripts/noi-dung-slide.py — cung mot nguon su that voi ban .pptx,
nen kich ban va slide khong bao gio lech nhau.

    python3 scripts/tao-kich-ban.py [docs/kich-ban-bao-ve.md]

Bang thoi luong trong kich ban duoc TINH tu so tu that, khong go tay. Go tay
thi sua ghi chu mot hoi la bang gio khong con dung nua, va nguoi tap noi theo
mot bang gio sai thi den hom bao ve moi biet la chay qua gio.
"""
import os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEN = {'__COVER__': 'Bìa', '__THANKS__': 'Cảm ơn'}

# Toc do noi tieng Viet khi trinh bay, tu moi phut. Noi nhanh hon thi khan gia
# khong kip hieu, cham hon thi chay qua gio.
TOC_DO = 150

DAU = """# Kịch bản nói khi bảo vệ

Sinh tự động từ `scripts/noi-dung-slide.py` bằng `scripts/tao-kich-ban.py`.
Sửa ghi chú ở đó rồi chạy lại **cả hai** script — đừng sửa thẳng vào tệp này,
lần dựng sau sẽ mất.

Phần lời nói ở đây **giống hệt** phần ghi chú người trình bày trong tệp
PowerPoint. Mở chế độ người trình bày là thấy lời nói ngay dưới slide; tệp này
để in ra cầm theo hoặc đọc lại khi tập.

## Hai bản, một bộ slide

Bộ slide có {tong} slide. Bạn **không nói hết** khi bảo vệ.

{bang}
**Khi bảo vệ** đi theo *đường ngắn*: hội đồng cho 10–20 phút *kể cả hỏi đáp*,
nên phần trình bày phải gọn trong khoảng {ngan_phut} phút để còn chỗ cho phần
hỏi. Những slide đánh dấu `[bản đầy đủ]` thì **bấm qua, không dừng lại nói**.

**Khi quay video nộp LMS** thì nói hết cả {tong} slide, vì video không bị bấm
giờ gắt như buổi bảo vệ và nói đủ thì người chấm thấy được chiều sâu của đồ án.

Nguyên tắc chọn đường ngắn: bỏ những slide **mô tả** (giao diện trông thế nào,
có bao nhiêu màn hình), giữ những slide trả lời câu hỏi **"vì sao"** — vì đó
là chỗ hội đồng chấm điểm.

> **Cách tập:** đọc to một lượt và bấm giờ thật. Đọc thầm bao giờ cũng nhanh
> hơn nói thật khoảng một phần ba. Mỗi slide dưới đây đều ghi sẵn số từ và số
> giây để bạn biết mình đang vượt ở đâu.

---
"""

def dem_tu(s):
    return len(s.split())


def main(out):
    ns = {}
    exec(open(os.path.join(ROOT, 'scripts', 'noi-dung-slide.py'), encoding='utf-8').read(), ns)
    slides, hoi_dap = ns['SLIDES'], ns.get('HOI_DAP', [])

    mo_rong = ns.get('MO_RONG', set())
    tu_slide = [dem_tu(n) for _, _, _, n in slides]
    tong_tu = sum(tu_slide)
    ngan_tu = sum(t for (ti, _, _, _), t in zip(slides, tu_slide) if ti not in mo_rong)
    so_ngan = sum(1 for ti, _, _, _ in slides if ti not in mo_rong)

    hang = ['| Bản | Slide | Số từ | Thời lượng |', '|---|---:|---:|---:|',
            '| **Đường ngắn** — nói khi bảo vệ | %d | %d | **~%.0f phút** |'
            % (so_ngan, ngan_tu, ngan_tu / TOC_DO),
            '| Bản đầy đủ — dùng cho video | %d | %d | ~%.0f phút |'
            % (len(slides), tong_tu, tong_tu / TOC_DO)]

    parts = [DAU.format(tong=len(slides), bang='\n'.join(hang) + '\n',
                        ngan_phut='%.0f' % (ngan_tu / TOC_DO))]

    for i, (title, bullets, img, notes) in enumerate(slides, 1):
        nhan = '  `[bản đầy đủ]`' if title in mo_rong else ''
        parts.append('## Slide %d — %s%s\n' % (i, TEN.get(title, title), nhan))
        if bullets:
            parts.append('**Trên slide:** ' + ' · '.join(bullets) + '\n')
        if img:
            parts.append('**Hình:** `%s`\n' % img)
        parts.append('*(%d từ · ~%d giây)*\n' % (tu_slide[i - 1],
                                                 round(tu_slide[i - 1] / TOC_DO * 60)))
        parts.append('**Nói:**\n')
        parts.append('> ' + notes.replace('\n', '\n> ') + '\n')

    if hoi_dap:
        parts.append('---\n')
        parts.append('# Dự kiến câu hỏi của hội đồng\n')
        parts.append(
            'Phần này **không lên slide**. Mỗi câu dưới đây nhắm vào một quyết '
            'định kỹ thuật mà đồ án đã chọn một trong nhiều đường, hoặc một '
            'giới hạn đã ghi trong báo cáo — đó là hai chỗ hội đồng hay hỏi '
            'nhất.\n')
        parts.append(
            'Đọc để **nắm ý**, đừng học thuộc. Trả lời bằng lời của mình thì '
            'nghe thật hơn, và nếu bị hỏi vặn tiếp thì vẫn xoay được.\n')
        for i, (hoi, dap) in enumerate(hoi_dap, 1):
            parts.append('### %d. %s\n' % (i, hoi))
            parts.append('> ' + dap.replace('\n', '\n> ') + '\n')
        parts.append('---\n')
        parts.append(
            '**Nếu gặp câu không biết:** nói thẳng là em chưa tìm hiểu chỗ đó, '
            'rồi nêu cái gần nhất mình có căn cứ. Hội đồng trừ điểm vì trả lời '
            'vòng vo nhiều hơn là vì một câu không biết.\n')

    open(out, 'w', encoding='utf-8').write('\n'.join(parts))
    print('  -> %s' % out)
    print('     đường ngắn: %d slide · %d từ · ~%.1f phút'
          % (so_ngan, ngan_tu, ngan_tu / TOC_DO))
    print('     bản đầy đủ: %d slide · %d từ · ~%.1f phút (tốc độ %d từ/phút)'
          % (len(slides), tong_tu, tong_tu / TOC_DO, TOC_DO))
    print('     %d câu hỏi dự kiến kèm câu trả lời' % len(hoi_dap))


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'docs', 'kich-ban-bao-ve.md'))
