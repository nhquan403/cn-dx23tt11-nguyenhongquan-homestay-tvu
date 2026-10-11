# Ảnh minh hoạ cho dữ liệu mẫu

25 ảnh chụp tải từ Unsplash, cộng một sơ đồ đường đi do mã vẽ ra.
`DemoDataSeeder` trỏ dữ liệu mẫu vào những đường dẫn này.

## Giấy phép

Cả 25 ảnh đều theo [Unsplash License](https://unsplash.com/license): dùng
được cho cả mục đích thương mại, không bắt buộc ghi nguồn, không phải xin
phép. Không tấm nào thuộc gói trả phí **Unsplash+** — gói đó có điều khoản
khác và đã bị loại khi chọn.

Không bắt buộc ghi nguồn, nhưng bảng dưới vẫn ghi để sau này còn tìm lại
được tấm gốc, và để người chấm đồ án kiểm tra được nguồn ảnh.

Tải ngày **11/10/2026** bằng `scripts/tai-anh-minh-hoa.sh`.

| Tệp | Mã ảnh trên Unsplash | Nội dung |
|---|---|---|
| hero.jpg | photo-1580630873708-e0475b1856c4 | Vòm cây rủ bóng xuống dòng kênh xanh |
| about.jpg | photo-1661200797567-6ba1d1e7ffb6 | Căn nhà mái lá nằm giữa vườn dừa |
| standard-1.jpg | photo-1784720845648-a79a9ba6d16d | Phòng ngủ giường đôi, sàn gỗ |
| standard-2.jpg | photo-1766431014990-39bb54f64f50 | Phòng ngủ nhỏ ấm cúng, tủ đầu giường |
| deluxe-1.jpg | photo-1731336478850-6bce7235e320 | Phòng ngủ đầu giường gỗ uốn cong |
| deluxe-2.jpg | photo-1765547090903-348b711f0eee | Phòng ngủ ốp nan gỗ, cửa sổ lớn |
| deluxe-3.jpg | photo-1584622650111-993a426fbf0a | Phòng tắm riêng, vòi sen kính |
| family-1.jpg | photo-1737517302831-e7b8a8eaa97c | Phòng hai giường đôi và gương lớn |
| family-2.jpg | photo-1776500587913-6e55907a738e | Phòng hai giường nhìn ra vườn |
| bungalow-1.jpg | photo-1776135933174-7465a18e98d9 | Dãy nhà sàn mái lá bên mặt nước |
| bungalow-2.jpg | photo-1780686222657-1ba6a42ee4d8 | Căn nhà tre mộc mạc giữa vườn cây |
| gallery-1.jpg | photo-1787057439418-9bc08c315559 | Lối đi trong vườn, hai hàng cau |
| gallery-2.jpg | photo-1780169875795-7dae6fc6fee1 | Bến gỗ, băng ngồi và chiếc xuồng |
| gallery-3.jpg | photo-1766050586763-723571af4dde | Tô phở bò nóng |
| gallery-4.jpg | photo-1782558399208-1f511bb57177 | Khu ăn uống ngoài trời dưới mái lá |
| gallery-5.jpg | photo-1541584285245-c83a93cce0e8 | Xe đạp dựng bên đường đất |
| gallery-6.jpg | photo-1559414131-b0aa53919648 | Chiếc võng bên mặt nước lúc hoàng hôn |
| gallery-7.jpg | photo-1547558902-0a66a7526661 | Con rạch nhỏ giữa hai hàng dừa nước |
| gallery-8.jpg | photo-1543411789-1a67a2ac05c6 | Đoàn xuồng chở khách trên sông |
| post-1.jpg | photo-1589562337460-9d825d2cd5a2 | Người chèo xuồng qua rạch dừa nước |
| post-2.jpg | photo-1597345637412-9fd611e758f3 | Tô bún bò với rau sống |
| post-3.jpg | photo-1657280846625-c6db67cacad6 | Người đạp xe trên con đường hai bên là cây |
| banner-1.jpg | photo-1777373863588-4d27e258e624 | Những căn nhà mái lá ven bờ sông |
| banner-2.jpg | photo-1750762286053-28632f48e717 | Thảm cỏ và hàng dừa trong khu vườn |
| banner-3.jpg | photo-1500981458086-b8a11cd163af | Xuồng chở khách giữa rạch dừa nước |

Địa chỉ tấm gốc: `https://images.unsplash.com/<mã ảnh>`.

## `map.svg` — tấm duy nhất vẫn là hình vẽ

Sơ đồ đường vào homestay do `scripts/ve-ban-do.py` vẽ ra. Lý do nó không
thành ảnh chụp: sơ đồ đường đi không phải một cảnh có thật để chụp. Việc của
nó là chỉ đường, và một tấm ảnh chụp từ trên cao vẫn không nói được "rẽ phải
ở đây".

```bash
python3 scripts/ve-ban-do.py
```

## Khổ ảnh

Khổ tải về bám theo tỉ lệ mà giao diện cắt ảnh, nên trình duyệt không phải
co kéo và không có khoảng trống thừa:

| Nhóm | Khổ | Tỉ lệ giao diện dùng |
|---|---|---|
| hero | 1600×733 | chiều cao co theo bề ngang màn hình |
| banner | 1400×525 | `aspect-[8/3]` |
| ảnh bìa bài viết | 1400×788 | `aspect-[16/9]` |
| ảnh phòng | 1280×800 | `aspect-[16/10]` thẻ, `aspect-[3/2]` trang chi tiết |
| thư viện ảnh | 1000×750 | `aspect-[4/3]` |
| about | 1100×880 | `aspect-[5/4]` |

Đã nén ở `-quality 72`, bỏ metadata, JPEG progressive. Cả thư mục 3,7 MB —
trung bình 148 KB một tấm.

## Thay bằng ảnh chụp thật của homestay

Chép ảnh vào đây với đúng tên tệp cũ là xong, không phải sửa một dòng mã nào.
Nhớ giữ đúng tỉ lệ trong bảng trên, và cập nhật lại bảng giấy phép: ảnh của
chính mình thì ghi "ảnh tự chụp" thay cho mã Unsplash.

Nếu muốn đổi tên tệp thì sửa đường dẫn trong
`backend/src/main/resources/db/seed/demo-data.sql`.

**Chú thích ảnh phải khớp với tấm ảnh.** Chú thích nằm ở `demo-data.sql`, không
nằm trong tên tệp. Thay ảnh mà quên sửa chú thích thì trang web nói một đằng
còn ảnh chỉ một nẻo — lỗi này không có lint nào bắt được.

Ảnh dự phòng khi một loại phòng chưa có ảnh nào là `../room-placeholder.svg`
— tệp khác, mục đích khác.
