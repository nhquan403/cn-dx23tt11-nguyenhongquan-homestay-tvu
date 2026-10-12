# Báo cáo trình bày

| Tệp | Nội dung |
|---|---|
| `slide-bao-ve.pptx` | 20 slide, khổ 16:9, tiêu đề 44pt, nội dung 32pt |
| `slide-bao-ve.pdf` | Bản PDF của cùng bộ slide, để chiếu khi máy không có PowerPoint |
| `poster.pdf` | Poster **60cm × 90cm hướng đứng**, đúng kích thước vật lý, đem đi in là ra đúng cỡ |
| `poster-xem-truoc.png` | Ảnh xem nhanh của poster, không dùng để in |

Kịch bản nói cho từng slide ở **`docs/kich-ban-bao-ve.md`**, và cũng nằm ngay
trong phần ghi chú của từng slide khi mở bằng PowerPoint.

## Dựng lại

```sh
pip install python-pptx
python3 scripts/tao-slide.py thesis/abs/slide-bao-ve.pptx
python3 scripts/tao-kich-ban.py docs/kich-ban-bao-ve.md

npm install playwright          # poster dựng bằng Chromium
node scripts/tao-poster.mjs thesis/abs/poster.pdf
```

Nội dung slide nằm ở `scripts/noi-dung-slide.py` — sửa ở đó rồi chạy lại **cả
hai** script để slide và kịch bản nói không lệch nhau.

## Việc còn phải làm tay

1. **Điền thông tin sinh viên ở slide bìa và trên poster**: tên GVHD, tên SVTH,
   mã số, lớp. Hiện là dấu chấm cho điền tay, giống các trang bìa của quyển báo
   cáo. Sửa trong `scripts/noi-dung-slide.py` và `scripts/tao-poster.mjs` rồi
   dựng lại, đừng sửa thẳng vào tệp đã xuất.
2. **Tập nói và bấm giờ.** Hội đồng cho 10–20 phút *kể cả hỏi đáp*, nên phần
   trình bày chỉ nên 10–12 phút — trung bình 35 giây một slide.
3. **Đặt in poster** trên giấy A0 hoặc bạt, 60cm × 90cm. Nội dung poster lấy
   từ chính báo cáo nên không phải viết lại; chỉ cần điền tên và đem đi in.

## Bản trình diễn

| Tệp | Nội dung |
|---|---|
| `demo-homestay-tvh.mp4` | Video **10 phút 47 giây**, đi hết toàn bộ quy trình, chia 12 phần có thẻ tiêu đề |
| `demo-anh/` | 40 ảnh chụp từng bước, cùng lượt với video |

Video quay ở 1440×900, 25 hình/giây, H.264, 16,5 MB. Có con trỏ chuột di chuyển thấy được, gõ phím từng ký
tự, gợn sóng mỗi lần bấm, viền sáng quanh ô đang thao tác, và thanh chú thích
chạy dưới màn hình.

**Vì sao phải vẽ con trỏ bằng tay.** Trình duyệt không vẽ con trỏ chuột vào
ảnh quay được — con trỏ là của hệ điều hành, không phải của trang. Một video
không có con trỏ thì các ô nhập tự dưng đầy chữ, các nút tự dưng bấm, và người
xem không theo được thao tác nào dẫn tới kết quả nào. Kịch bản tiêm một con trỏ
giả vào trang, cho nó nghe sự kiện `mousemove` **thật** mà Playwright bắn ra,
nên đường đi của nó đúng bằng đường đi của chuột thật.

**Vì sao không dùng `fill()` để điền biểu mẫu.** `fill()` đặt thẳng giá trị vào
ô, nên trên video chữ hiện ra nguyên một cục. Người xem không phân biệt được
"hệ thống tự điền" với "có người đang gõ", và đó là khác biệt quan trọng nhất
của một video trình diễn. Kịch bản gõ từng ký tự, 95ms một ký tự.

### Mười hai phần

| Phần | Nội dung |
|---|---|
| 1 | Trang của khách: trang chủ, banner, bốn loại phòng, thư viện ảnh, chi tiết một phòng |
| 2 | Khách đặt phòng: lịch **chặn sẵn ngày hết phòng**, chọn phòng, điền thông tin |
| 3 | Thanh toán: mã QR, đồng hồ 15 phút, nút mô phỏng chuyển khoản, tra cứu đơn |
| 4 | Chủ homestay đăng nhập — tài khoản dựng sẵn **bắt buộc đổi mật khẩu** |
| 5 | Bảng số liệu: doanh thu theo tháng, tỉ lệ lấp đầy, loại phòng bán chạy |
| 6 | Xử lý đơn: lọc theo trạng thái, tìm đúng đơn, xem chi tiết, **chuyển sang đã nhận phòng** |
| 7 | Đối soát thanh toán: khoản thiếu tiền, khoản thừa tiền, đánh dấu đã xử lý |
| 8 | Quản lý phòng: loại phòng, **thêm phòng mới**, khoảng ngày đóng phòng |
| 9 | Khuyến mãi: bốn cách một mã ngừng hiệu lực, **tạo mã mới** |
| 10 | Kiểm duyệt đánh giá: lọc bài chờ duyệt, **trả lời khách rồi duyệt** |
| 11 | Nội dung trang chủ, banner, thư viện ảnh, tin tức |
| 12 | Quay lại trang khách để đối chiếu thay đổi |

Những việc in đậm là thao tác **ghi dữ liệu thật** vào hệ thống, không phải chỉ
mở màn hình ra xem. Toàn bộ chạy trên bản đóng gói `docker compose`, đi qua
đúng máy chủ web — không có bước nào gọi tắt vào tầng trong.

### Quay lại

```sh
docker compose down -v && docker compose up -d
docker compose logs api | grep "Mat khau"
npm install playwright
node scripts/quay-demo.mjs http://localhost <mat-khau-quan-tri>
```

**Phải dựng lại cơ sở dữ liệu sạch trước mỗi lần quay.** Kịch bản đi qua bước
buộc đổi mật khẩu tạm, nên chạy lần thứ hai với mật khẩu cũ sẽ đăng nhập thất
bại. Script có hai chốt kiểm tra chặn việc đó: một chốt bắt buộc đơn phải sang
trạng thái đã xác nhận sau khi bấm nút chuyển khoản, một chốt bắt buộc phải vào
được khu quản trị.

Những cảnh không chạy được vì giao diện đổi đều được **ghi lại và in ra cuối
buổi quay**, chứ không bỏ qua im lặng. Một video thiếu ba cảnh mà người quay
không biết là một video tệ hơn một video dừng giữa chừng.

Chỉnh tốc độ gõ bằng biến môi trường `TOC_DO_GO` (mili giây mỗi ký tự, mặc
định 95).

### Dữ liệu mẫu cho buổi trình diễn

| Thứ | Nằm ở đâu |
|---|---|
| **Cuối tuần cháy phòng** — mọi loại phòng đều hết | +12 đến +14 ngày kể từ ngày khởi động. Lịch chặn sẵn hai đêm đó |
| Khoảng đóng phòng **đang áp dụng** | phòng B03, từ hôm qua tới +3 ngày |
| Khoảng đóng phòng **đã qua** (hệ thống tự mở lại) | phòng 101, −20 đến −15 ngày |
| Khoảng đóng phòng **sắp tới** | phòng 101, +40 đến +45 ngày |
| Ghi chú nội bộ | mười bốn đơn `TVHDEMO…` gần nhất |
| Thư đã gửi và **một thư thất bại** | đơn `TVHFULL01` mang trạng thái `FAILED` |
| Khoản thiếu tiền và khoản thừa tiền | màn hình đối soát, có sẵn khi mở |
