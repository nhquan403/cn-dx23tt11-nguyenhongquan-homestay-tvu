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

# (ten doan, slide dau, slide cuoi) — tinh theo so thu tu slide, bat dau tu 1
DOAN = [
    ('Mở đầu và bài toán', 1, 6),
    ('Vấn đề kỹ thuật then chốt', 7, 10),
    ('Thiết kế và cài đặt', 11, 15),
    ('Kết quả và kết luận', 16, 21),
]

DAU = """# Kịch bản nói khi bảo vệ

Sinh tự động từ `scripts/noi-dung-slide.py` bằng `scripts/tao-kich-ban.py`.
Sửa ghi chú ở đó rồi chạy lại **cả hai** script — đừng sửa thẳng vào tệp này,
lần dựng sau sẽ mất.

Phần lời nói ở đây **giống hệt** phần ghi chú người trình bày trong tệp
PowerPoint. Mở chế độ người trình bày là thấy lời nói ngay dưới slide; tệp này
để in ra cầm theo hoặc đọc lại khi tập.

**Thời lượng.** Hội đồng cho 10–20 phút *kể cả hỏi đáp*. Bản đầy đủ này dài
{tu} từ trên {so_slide} slide, tức khoảng **{day_du} phút** nếu nói ở tốc độ
{toc_do} từ mỗi phút.

Kịch bản được viết **dài hơn khung 10–12 phút một chút, có chủ đích**: thừa chữ
thì lúc nói bỏ bớt được, còn thiếu chữ thì đứng trên bục mới biết là không có
gì để nói. Mỗi slide đều ghi sẵn số từ và số giây để bạn biết mình đang vượt ở
đâu.

{bang}
> **Muốn gọn còn ~11 phút** thì cắt khoảng {can_cat} từ, và cắt ở ba slide mô tả
> (14, 15, 19) cùng phần dẫn nhập của slide 3. **Đừng cắt slide 9 và 10** — hai
> slide đó là phần có giá trị nhất của đề tài, và cũng là chỗ hội đồng sẽ hỏi.
>
> **Cách tập:** đọc to một lượt và bấm giờ thật. Đọc thầm bao giờ cũng nhanh
> hơn nói thật khoảng một phần ba.

---
"""


def dem_tu(s):
    return len(s.split())


def main(out):
    ns = {}
    exec(open(os.path.join(ROOT, 'scripts', 'noi-dung-slide.py'), encoding='utf-8').read(), ns)
    slides, hoi_dap = ns['SLIDES'], ns.get('HOI_DAP', [])

    tu_slide = [dem_tu(n) for _, _, _, n in slides]
    tong = sum(tu_slide)

    hang = ['| Đoạn | Slide | Số từ | Thời lượng |', '|---|---|---:|---:|']
    for ten, a, b in DOAN:
        t = sum(tu_slide[a - 1:b])
        hang.append('| %s | %d–%d | %d | ~%.1f phút |' % (ten, a, b, t, t / TOC_DO))
    hang.append('| **Cộng** | **1–%d** | **%d** | **~%.1f phút** |'
                % (len(slides), tong, tong / TOC_DO))

    # 11 phut la muc nham: hoi dong cho 10-20 phut ke ca hoi dap, de lai
    # khoang mot nua thoi gian cho phan hoi.
    can_cat = max(0, tong - 11 * TOC_DO)
    parts = [DAU.format(
        day_du='%.0f' % (tong / TOC_DO),
        toc_do=TOC_DO, tu=tong, so_slide=len(slides),
        bang='\n'.join(hang) + '\n', can_cat=can_cat)]

    for i, (title, bullets, img, notes) in enumerate(slides, 1):
        parts.append('## Slide %d — %s\n' % (i, TEN.get(title, title)))
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
    print('     %d slide · %d từ · ~%.1f phút ở tốc độ %d từ/phút'
          % (len(slides), tong, tong / TOC_DO, TOC_DO))
    print('     %d câu hỏi dự kiến kèm câu trả lời' % len(hoi_dap))


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'docs', 'kich-ban-bao-ve.md'))
