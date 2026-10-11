#!/usr/bin/env bash
# Tải lại 25 ảnh minh hoạ cho dữ liệu mẫu từ Unsplash.
#
# Chạy bộ này khi cần dựng lại thư mục ảnh từ đầu — ví dụ sau khi lỡ xoá, hoặc
# khi muốn đổi khổ ảnh. Ngày thường thì KHÔNG cần: 25 tệp đã nằm sẵn trong
# repo, bản đem đi bảo vệ không phải phụ thuộc vào việc phòng bảo vệ có mạng.
#
# Giấy phép: cả 25 tấm theo Unsplash License (dùng được cho mục đích thương
# mại, không bắt buộc ghi nguồn). Không tấm nào thuộc gói trả phí Unsplash+.
# Danh sách mã ảnh và nội dung từng tấm nằm ở README trong thư mục đích.
#
#   bash scripts/tai-anh-minh-hoa.sh
#
# Cần: curl và ImageMagick (lệnh `convert`).
set -euo pipefail

GOC="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RA="$GOC/frontend/public/images/demo"
mkdir -p "$RA"

# ten | ma anh tren Unsplash | be ngang tai ve | be doc tai ve | be ngang sau khi nen
# Khổ tải về bám theo tỉ lệ giao diện cắt ảnh; bước nén thu nhỏ lại cho nhẹ.
DANH_SACH="
hero|photo-1580630873708-e0475b1856c4|1920|880|1600
about|photo-1661200797567-6ba1d1e7ffb6|1200|960|1100
standard-1|photo-1784720845648-a79a9ba6d16d|1600|1000|1280
standard-2|photo-1766431014990-39bb54f64f50|1600|1000|1280
deluxe-1|photo-1731336478850-6bce7235e320|1600|1000|1280
deluxe-2|photo-1765547090903-348b711f0eee|1600|1000|1280
deluxe-3|photo-1584622650111-993a426fbf0a|1600|1000|1280
family-1|photo-1737517302831-e7b8a8eaa97c|1600|1000|1280
family-2|photo-1776500587913-6e55907a738e|1600|1000|1280
bungalow-1|photo-1776135933174-7465a18e98d9|1600|1000|1280
bungalow-2|photo-1780686222657-1ba6a42ee4d8|1600|1000|1280
gallery-1|photo-1787057439418-9bc08c315559|1200|900|1000
gallery-2|photo-1780169875795-7dae6fc6fee1|1200|900|1000
gallery-3|photo-1766050586763-723571af4dde|1200|900|1000
gallery-4|photo-1782558399208-1f511bb57177|1200|900|1000
gallery-5|photo-1541584285245-c83a93cce0e8|1200|900|1000
gallery-6|photo-1559414131-b0aa53919648|1200|900|1000
gallery-7|photo-1547558902-0a66a7526661|1200|900|1000
gallery-8|photo-1543411789-1a67a2ac05c6|1200|900|1000
post-1|photo-1589562337460-9d825d2cd5a2|1600|900|1400
post-2|photo-1597345637412-9fd611e758f3|1600|900|1400
post-3|photo-1657280846625-c6db67cacad6|1600|900|1400
banner-1|photo-1777373863588-4d27e258e624|1920|720|1400
banner-2|photo-1750762286053-28632f48e717|1920|720|1400
banner-3|photo-1500981458086-b8a11cd163af|1920|720|1400
"

tam=$(mktemp -d)
trap 'rm -rf "$tam"' EXIT

so=0
while IFS='|' read -r ten ma w h w_nen; do
  [ -z "$ten" ] && continue
  url="https://images.unsplash.com/${ma}?w=${w}&h=${h}&fit=crop&q=80&fm=jpg"
  ma_http=$(curl -sS -L -o "$tam/$ten.jpg" -w '%{http_code}' "$url")
  if [ "$ma_http" != "200" ]; then
    echo "LOI: $ten tra ve HTTP $ma_http" >&2
    exit 1
  fi
  # Chốt cứng: Unsplash trả trang lỗi dạng HTML với mã 200 khi mã ảnh sai.
  if ! identify "$tam/$ten.jpg" >/dev/null 2>&1; then
    echo "LOI: $ten tai ve khong phai anh — kiem tra lai ma anh" >&2
    exit 1
  fi
  convert "$tam/$ten.jpg" -resize "${w_nen}x" -strip -interlace Plane \
          -sampling-factor 4:2:0 -quality 72 "$RA/$ten.jpg"
  so=$((so + 1))
done <<< "$DANH_SACH"

tong=$(du -sh "$RA" | cut -f1)
echo "da tai $so anh, ca thu muc $tong"
