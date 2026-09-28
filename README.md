# Homestay TVH — Website giới thiệu và đặt phòng

**Đồ án thực tập chuyên ngành** — Khoa Kỹ thuật và Công nghệ, Trường Đại học Trà Vinh

Hệ thống đặt phòng trực tuyến cho một homestay ở Trà Vinh: trang bán hàng cho
khách tự đặt phòng và trả tiền cọc, khu quản trị cho chủ homestay, và REST API
nối hai bên. Khách chọn ngày, thấy phòng còn trống thật, đặt và chuyển khoản
qua mã QR; hệ thống nhận webhook báo tiền về rồi tự xác nhận đơn.

## Thông tin sinh viên thực hiện

| | |
|---|---|
| **Họ và tên** | Nguyễn Hồng Quân |
| **MSSV** | 170123592 |
| **Lớp** | DX23TT11 |
| **Giảng viên hướng dẫn** | ThS. Nguyễn Nhứt Lam |
| **Email** | *(điền)* |
| **Điện thoại** | *(điền)* |

## Đồ án này đã làm được gì

Một người mở repo lần đầu nên đọc mục này trước. Ba câu hỏi và câu trả lời:

**Bài toán là gì?** Homestay nhận đặt phòng qua điện thoại và tin nhắn. Chủ
nhà ghi vào sổ tay, nên hai khách hỏi cùng một phòng trong cùng một khoảng ngày
thì phụ thuộc vào việc chủ nhà có nhớ hay không. Mục tiêu là đưa việc giữ phòng
thành một ràng buộc máy móc, không phụ thuộc trí nhớ.

**Đã giải quyết ra sao?** Chống đặt trùng khoá ở **tầng cơ sở dữ liệu**, không
ở tầng service:

```sql
ALTER TABLE booking_rooms
  ADD CONSTRAINT booking_rooms_no_overlap
  EXCLUDE USING gist (room_id WITH =, stay WITH &&)
  WHERE (status = 'ACTIVE');
```

Hai giao dịch đồng thời cùng giành một phòng thì PostgreSQL tự từ chối một
giao dịch, kể cả khi hai tiến trình ứng dụng chạy trên hai máy khác nhau và
không biết gì về nhau. Kiểm tra bằng `SELECT` rồi `INSERT` ở tầng service không
làm được điều này — giữa hai câu lệnh luôn có một khe thời gian.

Đây cũng là lý do dự án chọn PostgreSQL thay vì MySQL: MySQL không có
`EXCLUDE`. Lập luận đầy đủ ở [docs/erd.md](docs/erd.md#vì-sao-exclude-using-gist).

**Làm được tới đâu?** Xem [Kết quả đo được](#kết-quả-đo-được) bên dưới — mọi con
số ở đó đều đo từ hệ thống đang chạy, không ước lượng.

### Phạm vi chức năng

| Khu | Làm được gì |
|---|---|
| **Khách** | Xem 4 loại phòng, chọn ngày trên lịch có chặn sẵn ngày hết phòng, đặt phòng không cần tài khoản, trả cọc bằng mã QR, tra cứu và tự huỷ đơn, đánh giá sau khi trả phòng |
| **Quản trị** | Bảng số liệu doanh thu và tỉ lệ lấp đầy, duyệt đơn, đối soát thanh toán, quản lý loại phòng và phòng, đóng phòng theo khoảng ngày, khuyến mãi, duyệt đánh giá, sửa nội dung trang chủ |
| **Hệ thống** | Đơn chưa trả cọc tự huỷ sau 15 phút, thư xác nhận qua hàng đợi outbox, webhook SePay có xác thực, giới hạn tần suất theo IP |

Luồng đặt phòng đầy đủ kèm biểu đồ tuần tự và tám trạng thái đơn:
[docs/luong-dat-phong.md](docs/luong-dat-phong.md).

## Chạy thử trong ba lệnh

```bash
git clone <repo-url> homestay-tvh && cd homestay-tvh
./scripts/init-env.sh          # sinh bí mật ngẫu nhiên vào .env
docker compose up -d --build   # 4 service: db, api, web, mailpit
```

Lần đầu chạy mất vài phút để tải ảnh nền và biên dịch. Khi `docker compose ps`
báo cả bốn service `healthy` thì mở:

| Địa chỉ | Là gì |
|---|---|
| <http://localhost> | Trang khách |
| <http://localhost/admin> | Khu quản trị |
| <http://localhost/swagger-ui/index.html> | API tương tác (chỉ profile `demo`) |
| <http://localhost:8025> | Hộp thư giả — xem thư xác nhận gửi đi |

**Mật khẩu quản trị demo** sinh ngẫu nhiên và chỉ nằm trong log container:

```bash
docker compose logs api | grep -i -A 4 'mat khau admin demo'
```

Tài khoản `admin@tvh.local`; lần đăng nhập đầu hệ thống **bắt buộc** đổi mật
khẩu. Tài khoản khách mẫu: `an.nguyen@example.com` / `khachdemo123`.

Máy không có Docker: xem đường chạy thủ công ở
[docs/cai-dat.md](docs/cai-dat.md#đường-2--chạy-thủ-công-không-cần-docker).

### Đi thử một vòng

Muốn thấy hệ thống làm gì mà không phải đoán, làm đúng thứ tự này:

1. Trang chủ → chọn một khoảng ngày → **Tìm phòng**. Ngày đã hết phòng bị mờ,
   không bấm chọn được.
2. Chọn một loại phòng → điền thông tin → đặt. Màn hình thanh toán hiện mã QR
   và đồng hồ đếm ngược 15 phút.
3. Profile `demo` có nút giả lập chuyển khoản ngay trên màn hình đó. Bấm vào,
   đơn chuyển sang **Đã xác nhận**, thư xác nhận rơi vào <http://localhost:8025>.
4. Mở <http://localhost/admin> → **Đơn đặt phòng** → thấy đơn vừa tạo.
5. Thử đặt lại đúng phòng đó, đúng khoảng ngày đó, ở một tab khác — hệ thống
   từ chối.

## Màn hình

> **Ba ảnh dưới đây là bản giao diện CŨ, chụp trước lần thiết kế lại ngày
> 24/09/2026.** Chưa thay được. Cách thay: `docker compose up -d`, mở
> <http://localhost>, <http://localhost/admin> và <http://localhost/admin/payments>
> ở bề ngang 1440px, chụp toàn trang, lưu đè lên ba tệp trong `docs/images/`.
> Gỡ ghi chú này sau khi thay xong.

### Trang chủ

![Trang chủ](docs/images/landing.png)

### Tổng quan quản trị

![Bảng số liệu khu quản trị](docs/images/admin-dashboard.png)

### Đối soát thanh toán

![Màn hình đối soát thanh toán](docs/images/admin-payments.png)

## Kết quả đo được

Mọi con số dưới đây đo từ hệ thống đang chạy hoặc đếm từ mã nguồn. Cột cuối nói
rõ đo bằng cách nào để người đọc kiểm lại được.

| Hạng mục | Kết quả | Đo bằng |
|---|---|---|
| Kiểm thử phía máy chủ | **129 test / 18 lớp**, tất cả xanh | `cd backend && ./mvnw verify` |
| Thao tác API | **80 thao tác trên 63 đường dẫn** | đếm từ `/v3/api-docs` của hệ thống đang chạy |
| Lược đồ cơ sở dữ liệu | **21 bảng**, 8 migration Flyway | đếm `CREATE TABLE` trong `db/migration/` |
| Khả năng tiếp cận | **0 vi phạm / 353 lượt đạt** trên 17 màn hình | axe-core 4.13.0, có chốt kiểm tra đăng nhập thật |
| Tương phản màu | **23/23 cặp đạt** WCAG 2.1 AA | trang `/ui-kit` tính lại lúc chạy |
| Gói giao diện | **317,54 kB** thô / **86,05 kB** nén | `ng build --configuration production` |
| Chữ tự host | **93,6 KB** cho 3 kiểu, đủ dấu tiếng Việt | đo trên tệp `.woff2` trong repo |
| Cuộn ngang | không có ở 360 / 768 / 1440 px | đo `scrollWidth` so với `innerWidth` |

Con số **129 test** và **80 thao tác** lấy từ [docs/kiem-thu.md](docs/kiem-thu.md)
và [docs/api.md](docs/api.md), nơi chúng được đo từ lần chạy thật. Đếm tĩnh
trong mã nguồn cho 113 phương thức mang `@Test` cộng 4 phương thức tham số hoá —
số 129 là số ca chạy sau khi các ca tham số hoá nở ra.

### Giao diện

Thiết kế lại toàn bộ ngày 24/09/2026 theo hướng "tạp chí": chữ hiển thị
Playfair Display cho tiêu đề, Be Vietnam Pro cho nội dung, cả hai **tự host**
trong `frontend/public/fonts/` vì CSP của nginx đặt `default-src 'self'` nên
font nạp từ CDN sẽ bị chặn.

Toàn bộ màu đi qua token trong `frontend/src/styles/tokens.css`; lint
`frontend/scripts/check-hardcoded-colors.mjs` chạy trước `ng lint` và chặn mã
màu lọt vào component. Không dùng emoji làm icon — 36 icon đều là SVG nội tuyến
trong `frontend/src/app/shared/ui/icon/`.

Quy ước đầy đủ: [docs/thiet-ke-giao-dien.md](docs/thiet-ke-giao-dien.md).

## Cấu trúc kho mã nguồn

| Thư mục | Nội dung |
|---|---|
| `backend/` | Mã nguồn tầng máy chủ — Java 21, Spring Boot 3.5.6 |
| `frontend/` | Mã nguồn tầng giao diện — Angular 21, Tailwind CSS 4 |
| `docs/` | Tài liệu kỹ thuật và **nội dung quyển báo cáo** (`docs/bao-cao/`) |
| `progress-report/` | **[bắt buộc]** Báo cáo tiến độ hàng tuần |
| `thesis/` | **[bắt buộc]** Tài liệu văn bản: `doc/ pdf/ html/ abs/ refs/` |
| `setup/` | Hướng dẫn cài đặt và dữ liệu thử |
| `scripts/` | Công cụ: xuất Word, vẽ ảnh minh hoạ, sinh báo cáo tuần, quay demo |
| `plans/` | Kế hoạch triển khai theo giai đoạn |

## Tiến độ

Báo cáo tiến độ hàng tuần ở [`progress-report/`](progress-report/). Bảng commit
trong mỗi báo cáo **sinh thẳng từ `git log`**, không chép tay, vì quy định lấy
lịch sử commit làm tiêu chí chấm điểm:

```bash
python3 scripts/tao-bao-cao-tuan.py 38    # bảng commit của tuần ISO 38
```

| Tuần | Kỳ | Nội dung chính | Commit |
|---|---|---|---:|
| 01 | 07/09 – 12/09/2026 | Hệ thiết kế, lược đồ CSDL và ràng buộc chống trùng, xác thực, lõi đặt phòng, thanh toán, khu quản trị | 21 |
| 02 | 16/09 – 20/09/2026 | Đóng gói Docker, dữ liệu mẫu, ngày khả dụng, tám tài liệu kỹ thuật, phần chữ báo cáo, 30 hình, script xuất Word | 20 |
| 03 | từ 21/09/2026 | Cắt báo cáo từ 66 xuống 52 trang, slide bảo vệ, poster 60×90cm | 3 |

## Quyển báo cáo và đề cương

Toàn bộ phần chữ viết bằng Markdown trong `docs/bao-cao/`, bản Word sinh tự
động — không gõ tay trong Word, để lần xuất sau không mất thay đổi:

```bash
python3 scripts/xuat-ban-word.py noi-dung thesis/doc/bao-cao-noi-dung.docx \
    "ThS. Nguyễn Nhứt Lam" "Nguyễn Hồng Quân"
```

Script áp sẵn quy định trình bày của khoa: Times New Roman 13pt, giãn dòng 1.5,
cách đoạn trước và sau 6pt, lề trên 2 – dưới 2 – trái 3 – phải 2 cm, số trang
góc phải dưới.

| Tài liệu | Số trang | Tệp |
|---|---:|---|
| Đề cương đồ án | 16 | [`docs/de-cuong-do-an.md`](docs/de-cuong-do-an.md) |
| Quyển báo cáo — nội dung | 52 | `docs/bao-cao/` → `thesis/doc/` |
| Tài liệu tham khảo và phụ lục | 30 | `docs/bao-cao/07-` và `08a/08b-` |

Số trang đếm trên bản PDF xuất ra, không ước lượng từ số từ. Hướng dẫn thi công
và việc còn lại trước khi nộp:
[docs/huong-dan-lam-bao-cao.md](docs/huong-dan-lam-bao-cao.md).

## Dữ liệu mẫu

Profile `demo` nạp sẵn: **4 loại phòng**, **15 phòng vật lý**, **12 tiện ích**,
**40 đơn đặt phòng** trải đủ tám trạng thái, 3 khoản cần đối soát, 3 mã khuyến
mãi (còn hạn / hết hạn / hết lượt), 8 đánh giá, và nội dung trang chủ đầy đủ.

Ba khoảng đóng phòng, mỗi khoảng chứng minh một điều khác nhau:

| Khoảng | Chứng minh |
|---|---|
| `CURRENT_DATE + 40 … + 45` | Phòng bị chặn trước trong lịch tương lai |
| `CURRENT_DATE - 1 … + 3` | Phòng đang đóng bị trừ khỏi kết quả tìm kiếm **ngay bây giờ** |
| `CURRENT_DATE - 20 … - 15` | Hệ thống tự mở lại phòng khi khoảng đóng đã qua, không cần ai nhớ bật |

Mọi ngày trong dữ liệu mẫu là **tương đối** (`CURRENT_DATE ± n`), nên bộ dữ liệu
không cũ đi theo thời gian — mở repo sau sáu tháng vẫn thấy đơn "sắp tới".

Seed **không** đi qua Flyway, lý do ở
[DemoDataSeeder](backend/src/main/java/com/tvh/homestay/demo/DemoDataSeeder.java).

26 ảnh minh hoạ là SVG sinh ra từ `scripts/ve-anh-minh-hoa.py`, không phụ thuộc
mạng. Thay bằng ảnh chụp thật: chép đè vào `frontend/public/images/demo/` với
đúng tên tệp cũ, không phải sửa dòng mã nào.

## Yêu cầu môi trường

| Công cụ | Bản tối thiểu | Ghi chú |
|---|---|---|
| Docker | có Compose v2 | đường chạy khuyến nghị |
| JDK | 21 | chỉ khi chạy thủ công |
| Node.js | 20.19+ hoặc 22.12+ | Angular 21 yêu cầu |
| PostgreSQL | 16 | chỉ khi chạy thủ công — cần `btree_gist` |

## Profile

Chỉ có hai:

| Profile | Dùng khi | Gồm gì |
|---|---|---|
| `demo` | Phát triển và bản đem đi bảo vệ | Dữ liệu mẫu, Swagger UI, trang `/ui-kit` |
| `prod` | Triển khai thật | Không dữ liệu mẫu, không Swagger, không `/ui-kit` |

Đổi profile trên cùng một volume dữ liệu là an toàn — đây chính là lý do dữ liệu
mẫu không nằm trong lịch sử Flyway:

```bash
SPRING_PROFILES_ACTIVE=prod docker compose up -d api
```

## Bí mật

`JWT_SECRET` và `SEPAY_WEBHOOK_API_KEY` không có giá trị mặc định ở bất kỳ đâu:
không trong `application.yml`, không trong `.env.example`, không trong
`docker-compose.yml`. Ứng dụng dừng khởi động khi thiếu, ở mọi profile.
`scripts/init-env.sh` là đường duy nhất tạo ra giá trị thật.

Repo này công khai. Một giá trị mặc định "an toàn cho demo" nằm trong repo đồng
nghĩa với việc bất kỳ ai clone về cũng tự ký được JWT vai trò ADMIN cho mọi bản
triển khai dùng repo này.

## Múi giờ

Toàn hệ thống chạy `Asia/Ho_Chi_Minh`, đặt ở **bốn tầng độc lập**: biến `TZ` của
container, `-Duser.timezone` cho JVM, `spring.jackson.time-zone`, và
`hibernate.jdbc.time_zone`.

Chỉ đặt `spring.jackson.time-zone` là **không đủ** — thuộc tính đó chỉ chi phối
cách Jackson serialize JSON, không đổi `TimeZone.getDefault()` và không ảnh
hưởng `LocalDate.now()`. Hệ quả nếu làm sai: booking tạo trong khung 00:00–07:00
giờ Việt Nam bị gom nhóm vào tháng trước ở bảng số liệu, trong khi đồng hồ đếm
ngược trên màn hình thanh toán vẫn đúng — sai một nửa nên rất khó nghi ngờ.

Endpoint `/api/health` phơi bày cả `appZone` lẫn `jvmDefaultZone` để kiểm tra
được điều này bằng mắt.

## Kiểm thử

```bash
cd backend  && ./mvnw verify              # 129 test — CẦN Docker (Testcontainers)
cd frontend && npm run build && npm run lint
```

Testcontainers dựng một PostgreSQL thật cho mỗi lần chạy, không dùng H2: ràng
buộc `EXCLUDE USING gist` là thứ quan trọng nhất cần kiểm, mà H2 không có nó —
test chạy trên H2 sẽ xanh trong khi hệ thống thật vẫn hỏng.

Từng lớp test chứng minh điều gì: [docs/kiem-thu.md](docs/kiem-thu.md).

## Sự cố thường gặp

**`npm error Cannot read properties of null (reading 'edgesOut')`**
Lỗi của npm 10.9.x khi giải phụ thuộc peer optional của `vitest`. Dùng npm 11:

```bash
npx npm@11 install
```

**App không khởi động, log báo thiếu `JWT_SECRET`**
Đúng như thiết kế. Chạy `./scripts/init-env.sh`.

**Trang chủ trắng trơn, không có nội dung**
Không chạy ở profile `demo` nên dữ liệu mẫu không được nạp. Kiểm tra
`SPRING_PROFILES_ACTIVE`.

Bảng đầy đủ: [docs/cai-dat.md](docs/cai-dat.md#xử-lý-sự-cố).

## Tài liệu

| Tài liệu | Nội dung |
|---|---|
| [kien-truc.md](docs/kien-truc.md) | Thành phần hệ thống, phân lớp, lý do từng quyết định |
| [erd.md](docs/erd.md) | 21 bảng, từng ràng buộc, và **hai** lần dùng `EXCLUDE USING gist` |
| [use-case.md](docs/use-case.md) | 3 tác nhân, 6 use case chính có đặc tả đầy đủ |
| [luong-dat-phong.md](docs/luong-dat-phong.md) | Sequence đặt phòng, thanh toán, và biểu đồ 8 trạng thái |
| [api.md](docs/api.md) | 80 thao tác, quyền truy cập, giới hạn tần suất, mã lỗi |
| [bao-mat.md](docs/bao-mat.md) | Mô hình bảo mật **và 7 giới hạn đã biết** |
| [cai-dat.md](docs/cai-dat.md) | Cài đặt bằng Docker và không Docker, xử lý sự cố |
| [kiem-thu.md](docs/kiem-thu.md) | 129 test — từng lớp chứng minh điều gì |
| [thanh-toan-sepay.md](docs/thanh-toan-sepay.md) | Chi tiết tích hợp SePay và webhook |
| [so-lieu-va-quan-tri.md](docs/so-lieu-va-quan-tri.md) | Cách tính số liệu bảng quản trị |
| [thiet-ke-giao-dien.md](docs/thiet-ke-giao-dien.md) | Design system, token màu, quy ước UI |

Kế hoạch triển khai đầy đủ:
[`plans/260907-1304-homestay-tvh-booking/`](plans/260907-1304-homestay-tvh-booking/)
— mở `plan.html` để xem bản trình bày có sơ đồ và mockup.
