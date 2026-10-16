# Hình của báo cáo

Mỗi tệp ở đây ứng với đúng một dấu chỗ đặt `[Hình X.Y]` trong `docs/bao-cao/`.
Tên tệp theo khuôn `hinh-<chương>-<số>-<mô-tả-không-dấu>.png`, nên khi chèn vào
Word chỉ cần đọc theo thứ tự tên tệp là ra đúng thứ tự hình trong báo cáo.

Ảnh chụp giao diện lấy ở tỉ lệ điểm ảnh gấp đôi để in A4 không rỗ, và **không
chụp tay**: `scripts/chup-anh-bao-cao.mjs` dựng lại cả mười tấm trên bản đang
chạy thật. Chụp tay thì mỗi lần ra một khổ khác nhau, và lần sau ghép vào Word
lại phải căn lại từ đầu.

```sh
# cần một bản đang chạy và mật khẩu quản trị trong một tệp
node scripts/chup-anh-bao-cao.mjs http://127.0.0.1:4300 /đường/dẫn/mật-khẩu
node scripts/quet-kha-nang-tiep-can.mjs http://127.0.0.1:4300 /đường/dẫn/mật-khẩu
```

Giao diện đổi thì phải chạy lại hai lệnh trên, nếu không quyển báo cáo sẽ mô tả
một giao diện không còn tồn tại.

Số hình phải chạy **theo thứ tự xuất hiện** trong bài. Khi thêm hoặc bớt một
hình thì phải đánh số lại cả dãy, đổi tên tệp theo, rồi chạy lại bộ xuất bản —
`scripts/xuat-ban-word.py` in ra cảnh báo nếu một dấu chỗ đặt không có tệp ảnh.

## Bảng đối chiếu

| Hình | Tệp | Cách tạo ra |
|---|---|---|
| 1.1 | `hinh-1-1-khoang-nua-mo.png` | Mermaid, dựng bằng trình duyệt |
| 1.2 | `hinh-1-2-quy-trinh-thu-cong.png` | SVG viết tay, dựng bằng `scripts/ve-hinh-bao-cao.mjs` |
| 2.1 | `hinh-2-1-kien-truc-tong-the.png` | Mermaid |
| 2.2 | `hinh-2-2-tranh-chap-dat-phong.png` | Mermaid |
| 3.1 | `hinh-3-1-use-case.png` | Mermaid |
| 3.2 | `hinh-3-2-erd-tong-the.png` | Mermaid |
| 3.3 | `hinh-3-3-erd-dat-phong.png` | Mermaid |
| 3.4 | `hinh-3-4-bieu-do-lop.png` | Mermaid |
| 3.5 | `hinh-3-5-trang-thai-don.png` | Mermaid |
| 3.6 | `hinh-3-6-tuan-tu-dat-phong.png` | Mermaid |
| 3.7 | `hinh-3-7-tuan-tu-thanh-toan.png` | Mermaid |
| 3.8 | `hinh-3-8-tuan-tu-tien-ve-muon.png` | Mermaid |
| 3.9 | `hinh-3-9-phan-lop-backend.png` | Mermaid |
| 3.10 | `hinh-3-10-trang-chu.png` | Chụp tự động — trang chủ, mở sẵn lịch chọn ngày |
| 3.11 | `hinh-3-11-ba-buoc-dat-phong.png` | Chụp tự động — ghép ba bước của trình tự `/dat-phong` |
| 3.12 | `hinh-3-12-thanh-toan.png` | Chụp tự động — màn thanh toán của một đơn đặt thật, mã QR lấy từ dịch vụ thật |
| 3.13 | `hinh-3-13-dashboard.png` | Chụp tự động — trang tổng quan quản trị |
| 4.1 | `hinh-4-1-do-tuong-phan.png` | Dựng tự động từ màu **đo trên trang đang chạy**, không gõ tay mã màu |
| 4.2 | `hinh-4-2-quet-kha-nang-tiep-can.png` | Bảng kết quả do `quet-kha-nang-tiep-can.mjs` quét và dựng ra |
| 4.3 | `hinh-4-3-ba-kich-thuoc-man-hinh.png` | Chụp tự động ở ba độ rộng 390 / 820 / 1440 px rồi ghép |
| A.1 | `hinh-a-1-ngay-kha-dung.png` | Chụp tự động — màn quản lý phòng và ngày khả dụng |
| A.2 | `hinh-a-2-doi-mat-khau.png` | Chụp tự động — bước buộc đổi mật khẩu tạm ở lần đăng nhập đầu |
| A.3 | `hinh-a-3-chi-tiet-loai-phong.png` | Chụp tự động — trang chi tiết loại phòng |

## Vì sao mười tấm ảnh được chụp lại

Mười tấm ảnh giao diện trong quyển báo cáo được chụp lần đầu ngày 20/09/2026.
Sau mốc đó giao diện đi qua **tám lần sửa liên tiếp**: đổi bảng màu sang xanh
biển, tự host bộ chữ và thay bộ token, thay emoji bằng icon SVG, dựng lại bố
cục trang chủ và toàn bộ khu khách theo ngôn ngữ tạp chí, dựng lại khu quản
trị quanh bảng biểu, đổi ngưỡng hiện thanh điều hướng ngang, và đưa nhãn của ô
chọn ngày ra ngoài.

Nói cách khác, mọi tấm ảnh giao diện trong quyển đều đang tả một giao diện
không còn tồn tại. Cả mười tấm đã được chụp lại trên bản đang chạy.

Hai tấm không phải ảnh chụp cũng phải dựng lại vì cùng lý do: Hình 4.1 ghi mã
màu của nút chính (bảng màu đã đổi từ `#0F5C4C` sang `#0E5C63`), còn Hình 4.2
là bảng kết quả quét khả năng tiếp cận — quét lại trên giao diện mới cho **0
vi phạm trên 17 màn hình**, nhưng số lần quy tắc đạt là **353** chứ không phải
356 như bản cũ, nên mục 4.4.1 của báo cáo đã sửa theo.

## Những hình đã bỏ và lý do

Quyển báo cáo phải nằm trong khoảng 30–50 trang nội dung. Năm tấm bỏ ở vòng rà
soát trước là năm ảnh chụp trùng ý với ảnh khác. Ba tấm bỏ ở vòng này thì khác:
cả ba đều **chỉ nói lại đúng cái mà chữ hoặc bảng ngay cạnh nó đã nói**.

| Hình cũ | Nội dung | Vì sao bỏ |
|---|---|---|
| 3.10 | Ảnh chụp giao diện tài liệu tương tác | Bảng ngay trên nó đã liệt kê nhóm endpoint, và Phụ lục E có đủ 82 thao tác |
| 3.11 | Sơ đồ phụ thuộc mười giai đoạn | Đoạn văn ngay trước đã kể đủ mười giai đoạn kèm số giờ; câu về hai cặp chạy song song giữ lại trong văn |
| 3.16 | Kết xuất `docker compose ps` | Khối lệnh ngay trên đã ghi "chạy 4 dịch vụ"; câu kết của mục nói rõ cả bốn báo `healthy` |

Hình 1.2 thì không bỏ mà **vẽ lại**: bản Mermaid cũ xếp chín ô thành một cột dọc
1851×3993, in ra cao 18cm nên chiếm gần trọn một trang và đẩy Hình 1.1 sang
trang trước, để lại trang đó chỉ có bảy dòng chữ. Bản mới xếp rắn bò hai hàng
ngang, cao 7cm, giữ nguyên chín ô và ba ô rủi ro.

## Một hình tuỳ chọn

Mục 1.3 của báo cáo so sánh với các nền tảng đặt phòng sẵn có. Hiện mục này
**chạy bằng chữ, không có hình**, và bài vẫn đủ ý. Nếu muốn thêm một ảnh chụp
trang kết quả tìm kiếm của Booking.com để đối chiếu thì người viết phải tự mở
trình duyệt chụp — đây là trang web bên ngoài nên **phải ghi nguồn và ngày
chụp** ngay dưới hình. Lưu thành `hinh-1-3-<mô-tả>.png` rồi thêm dòng
`[Hình 1.3]` kèm câu dẫn vào `docs/bao-cao/02-chuong-1.md`; vì nó nằm cuối
chương 1 nên không phải đánh số lại hình nào khác.
