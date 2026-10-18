#!/usr/bin/env bash
#
# Đóng gói một tệp nén duy nhất để nộp lên LMS, theo mục 6.3 của hướng dẫn nộp.
#
#     ./scripts/dong-goi-nop-bai.sh
#
# Hệ thống chỉ cho phép nộp MỘT tệp, và tệp đó phải gồm ba thứ:
#   1. Báo cáo đồ án dạng Word
#   2. Bản thuyết trình PowerPoint — PHẢI chứa liên kết video thuyết trình
#   3. Mã nguồn, hoặc liên kết tới mã nguồn
#
# Chạy lại kịch bản này SAU KHI đã dán liên kết video vào slide "Liên kết",
# nếu không tệp nộp sẽ thiếu đúng thứ mà hướng dẫn bắt buộc phải có.
set -euo pipefail
cd "$(dirname "$0")/.."

MSSV='170123592'
HO_TEN='Nguyen Hong Quan'
LOP='DX23TT11'
KHO='https://github.com/nhquan403/cn-dx23tt11-nguyenhongquan-homestay-tvu'

BAO_CAO='thesis/doc/bao-cao-tron-bo.docx'
SLIDE='thesis/abs/slide-bao-ve.pptx'
RA="thesis/nop-bai"
TEN="${MSSV}_${HO_TEN}_${LOP}"

for f in "$BAO_CAO" "$SLIDE"; do
    [ -f "$f" ] || { echo "Thiếu $f — dựng lại trước khi đóng gói." >&2; exit 1; }
done

# Chốt cứng: bản thuyết trình phải có liên kết video thật, không còn chỗ trống.
# Không có chốt này thì rất dễ nộp một tệp thiếu đúng thứ bắt buộc mà không ai
# phát hiện cho tới khi bị trả bài.
if python3 - "$SLIDE" <<'PY'
import sys, zipfile, re
xml = b''.join(zipfile.ZipFile(sys.argv[1]).read(n)
               for n in zipfile.ZipFile(sys.argv[1]).namelist()
               if n.startswith('ppt/slides/slide'))
sys.exit(0 if re.search(rb'D\xc3\x81N LI\xc3\x8aN K\xe1\xba\xbeT', xml) else 1)
PY
then
    echo
    echo "  ⚠  Bản thuyết trình VẪN CÒN chỗ trống «DÁN LIÊN KẾT GOOGLE DRIVE VÀO ĐÂY»."
    echo "     Hướng dẫn nộp đòi bản PowerPoint phải chứa liên kết video thuyết trình."
    echo "     Hãy quay video, tải lên Google Drive, dán liên kết vào slide 'Liên kết',"
    echo "     rồi chạy lại kịch bản này."
    echo
    if [ "${1:-}" = "-y" ]; then
        echo "  (đóng gói thử theo cờ -y — tệp này CHƯA nộp được)"
    elif [ -t 0 ]; then
        read -r -p "  Vẫn đóng gói để nộp thử? [y/N] " tra_loi
        [ "$tra_loi" = y ] || [ "$tra_loi" = Y ] || { echo "  Đã dừng."; exit 1; }
    else
        echo "  Dừng. Chạy lại với cờ -y nếu chỉ muốn đóng gói thử."
        exit 1
    fi
fi

rm -rf "$RA"; mkdir -p "$RA/$TEN"
cp "$BAO_CAO" "$RA/$TEN/Bao cao do an - ${HO_TEN}.docx"
cp "$SLIDE"   "$RA/$TEN/Ban thuyet trinh - ${HO_TEN}.pptx"
cat > "$RA/$TEN/Lien ket ma nguon.txt" <<EOF
MÃ NGUỒN ĐỒ ÁN
${KHO}

Kho để CÔNG KHAI nên mở được ngay, không cần xin quyền truy cập.
Toàn bộ mã nguồn, tài liệu, bản trình diễn và các tệp đã nộp đều nằm trong kho.

Sinh viên thực hiện : ${HO_TEN}
Mã số sinh viên     : ${MSSV}
Lớp                 : ${LOP}
EOF

( cd "$RA" && zip -q -r "${TEN}.zip" "$TEN" && rm -rf "$TEN" )

echo "  -> $RA/${TEN}.zip  ($(du -h "$RA/${TEN}.zip" | cut -f1))"
unzip -l "$RA/${TEN}.zip" | sed -n '4,8p'
