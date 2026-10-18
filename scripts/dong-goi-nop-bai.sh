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
HO_TEN='Nguyễn Hồng Quân'
HO_TEN_KHONG_DAU='Nguyen Hong Quan'
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
cp "$BAO_CAO" "$RA/$TEN/Bao cao do an - ${HO_TEN_KHONG_DAU}.docx"
cp "$SLIDE"   "$RA/$TEN/Ban thuyet trinh - ${HO_TEN_KHONG_DAU}.pptx"

# Mã nguồn: lấy từ chính commit đang đứng, nên không bao giờ dính tệp rác,
# tệp build hay tệp .env — git chỉ xuất ra những gì đã được theo dõi.
# Bỏ thesis/ vì đó là các bản đã xuất, mà hai bản cần nộp đã nằm ngay cạnh đây.
mkdir -p "$RA/$TEN/Ma nguon"
git archive HEAD $(git ls-tree --name-only HEAD | grep -v '^thesis$') \
    | tar -x -C "$RA/$TEN/Ma nguon"
# Hình minh hoạ của báo cáo nặng 15 MB mà đã in nguyên trong quyển .docx ngay
# cạnh đây, chép thêm một lần nữa chỉ làm tệp nộp nặng gấp đôi mà không thêm gì.
rm -rf "$RA/$TEN/Ma nguon/docs/images"

cat > "$RA/$TEN/Doc truoc khi cham.txt" <<EOF
ĐỒ ÁN THỰC TẬP CHUYÊN NGÀNH
XÂY DỰNG WEBSITE GIỚI THIỆU VÀ ĐẶT PHÒNG HOMESTAY — HOMESTAY TVH

Sinh viên thực hiện : ${HO_TEN}
Mã số sinh viên     : ${MSSV}
Lớp                 : ${LOP}

TỆP NÉN NÀY GỒM

  Bao cao do an - ${HO_TEN_KHONG_DAU}.docx
      Quyển báo cáo trọn bộ 98 trang: trang bìa, nhận xét, mục lục,
      47 trang nội dung, tài liệu tham khảo và phụ lục.

  Ban thuyet trinh - ${HO_TEN_KHONG_DAU}.pptx
      28 slide, có ghi chú người trình bày ở từng slide.
      Liên kết video thuyết trình nằm ở slide 27 — "Liên kết".

  Ma nguon/
      Toàn bộ mã nguồn: backend (Java 21, Spring Boot 3.5),
      frontend (Angular 21, Tailwind CSS v4), docker-compose,
      script dựng tài liệu và tài liệu kỹ thuật.
      Cách chạy xem Ma nguon/README.md.

KHO MÃ NGUỒN TRỰC TUYẾN

  ${KHO}

  Kho để CÔNG KHAI nên mở được ngay, không cần xin quyền truy cập.
  Thư mục ảnh minh hoạ của tài liệu (docs/images) và các bản đã xuất
  (thesis/) không chép vào đây cho tệp nén nhẹ — xem trên kho nếu cần.
EOF

cd "$RA"
if command -v rar >/dev/null 2>&1; then
    rar a -r -idq "${TEN}.rar" "$TEN"
    GOI="${TEN}.rar"
else
    echo "  (không có lệnh rar — đóng gói .zip thay thế)" >&2
    zip -q -r "${TEN}.zip" "$TEN"
    GOI="${TEN}.zip"
fi
rm -rf "$TEN"

echo "  -> $RA/${GOI}  ($(du -h "$GOI" | cut -f1))"
