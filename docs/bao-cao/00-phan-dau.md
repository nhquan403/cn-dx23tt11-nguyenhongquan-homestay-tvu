<!-- de-tai: XÂY DỰNG WEBSITE GIỚI THIỆU VÀ ĐẶT PHÒNG HOMESTAY — HOMESTAY TVH -->
<!-- loai: ĐỒ ÁN THỰC TẬP CHUYÊN NGÀNH -->
<!-- sinh-vien: Nguyễn Hồng Quân | 170123592 | DX23TT11 -->
<!-- nganh: Công nghệ Thông tin -->
<!-- khoa-hoc: 2023–2027 -->
<!-- gvhd: ThS. Nguyễn Nhứt Lam -->
<!-- hoc-vi: Thạc sĩ -->
<!-- noi-ngay: Trà Vinh, tháng 10 năm 2026 -->

# CÁC TRANG ĐẦU

Tệp này là **nguồn dữ liệu** của các trang đầu, không phải bản mô tả. Bộ xuất
bản đọc khối chú thích ở đầu tệp và các mục dưới đây rồi dựng thẳng ra Word
theo biểu mẫu BM5 của Khoa Kỹ thuật và Công nghệ — Trường Đại học Trà Vinh.

Sửa thông tin cá nhân thì sửa khối chú thích ở đầu tệp, đừng sửa trong mã.

Chạy: `python3 scripts/xuat-ban-word.py tron-bo thesis/doc/bao-cao-tron-bo.docx`

---

## LỜI MỞ ĐẦU

Du lịch homestay tại Trà Vinh đang phát triển cùng làn sóng du lịch trải nghiệm
và du lịch cộng đồng. Phần lớn cơ sở trong nhóm này do hộ gia đình tự vận hành,
nhận đặt phòng qua tin nhắn và quản lý lịch phòng bằng trí nhớ hoặc sổ giấy.
Cách làm đó dẫn tới một rủi ro thường trực: hai khách nhắn tin gần như cùng lúc
và cùng được trả lời là còn phòng, sai sót chỉ lộ ra vào ngày nhận phòng.

Đồ án xây dựng một website giới thiệu và đặt phòng cho cơ sở lưu trú Homestay
TVH, gồm ba khối: trang bán hàng cho khách, khu quản trị cho chủ homestay và
giao diện lập trình ứng dụng kết nối hai khối đó.

Điểm trọng tâm về kỹ thuật của đồ án không nằm ở số lượng chức năng, mà ở cách
giải bài toán chống đặt trùng phòng. Đồ án đặt ràng buộc toàn vẹn ở tầng cơ sở
dữ liệu thay vì kiểm tra ở tầng ứng dụng, và chứng minh tính đúng đắn bằng kiểm
thử đa luồng trên hệ quản trị cơ sở dữ liệu thật.

Do thời gian và kiến thức còn hạn chế, đồ án không tránh khỏi thiếu sót. Em rất
mong nhận được ý kiến đóng góp của quý Thầy Cô.

## LỜI CẢM ƠN

Em xin gửi lời cảm ơn chân thành đến ThS. Nguyễn Nhứt Lam đã tận tình hướng
dẫn, góp ý và tạo điều kiện cho em hoàn thành đồ án này. Những nhận xét thẳng
thắn của Thầy trong các buổi báo cáo tiến độ đã giúp em nhận ra nhiều thiếu sót
mà bản thân không tự thấy được.

Em cũng xin cảm ơn quý Thầy Cô Khoa Kỹ thuật và Công nghệ — Trường Đại học Trà
Vinh đã truyền đạt kiến thức nền tảng trong suốt quá trình học tập. Đặc biệt,
những kiến thức về cơ sở dữ liệu đã trực tiếp giúp em giải quyết bài toán cốt
lõi của đề tài này.

Cuối cùng, em xin cảm ơn gia đình và những người đã luôn ủng hộ em.

Em xin chân thành cảm ơn!

## KÍ HIỆU CÁC CỤM TỪ VIẾT TẮT

| Viết tắt | Nghĩa đầy đủ |
|---|---|
| ACID | Atomicity, Consistency, Isolation, Durability — bốn tính chất của giao dịch |
| API | Application Programming Interface — giao diện lập trình ứng dụng |
| CMS | Content Management System — hệ quản trị nội dung |
| CSDL | Cơ sở dữ liệu |
| CSS | Cascading Style Sheets — ngôn ngữ định kiểu trang web |
| CSV | Comma-Separated Values — định dạng tệp phân cách bằng dấu phẩy |
| ERD | Entity Relationship Diagram — sơ đồ quan hệ thực thể |
| GiST | Generalized Search Tree — cây tìm kiếm tổng quát |
| HTML | HyperText Markup Language — ngôn ngữ đánh dấu siêu văn bản |
| HTTP | HyperText Transfer Protocol — giao thức truyền siêu văn bản |
| JPA | Jakarta Persistence API — chuẩn ánh xạ đối tượng quan hệ của Java |
| JSON | JavaScript Object Notation — định dạng trao đổi dữ liệu |
| JWT | JSON Web Token — chuẩn token xác thực |
| QR | Quick Response — mã phản hồi nhanh |
| REST | REpresentational State Transfer — kiểu kiến trúc giao diện lập trình |
| SQL | Structured Query Language — ngôn ngữ truy vấn có cấu trúc |
| UML | Unified Modeling Language — ngôn ngữ mô hình hoá thống nhất |
| WCAG | Web Content Accessibility Guidelines — hướng dẫn khả năng tiếp cận web |
| XSS | Cross-Site Scripting — tấn công chèn mã kịch bản |

---

## TÓM TẮT ĐỒ ÁN

Đồ án xây dựng website giới thiệu và đặt phòng cho cơ sở lưu trú Homestay TVH,
giải quyết ba vấn đề của quy trình đặt phòng thủ công hiện nay: kênh đặt phòng
phân mảnh, rủi ro đặt trùng phòng, và chi phí hoa hồng của sàn trung gian.

**Vấn đề nghiên cứu.** Bài toán cốt lõi là bảo đảm không bao giờ tồn tại hai đơn
đặt phòng còn hiệu lực cùng giữ một phòng vật lý trong những ngày giao nhau.
Đây là một bài toán tranh chấp dữ liệu, không giải được đúng bằng mẫu kiểm tra
rồi ghi ở tầng ứng dụng vì giữa hai thao tác luôn tồn tại một khe hở thời gian.

**Hướng tiếp cận.** Đồ án đặt ràng buộc toàn vẹn ở tầng lưu trữ bằng ràng buộc
loại trừ `EXCLUDE USING gist` trên kiểu dữ liệu khoảng `daterange` của
PostgreSQL. Hướng này có căn cứ từ chính tài liệu PostgreSQL, vốn khuyến cáo
dùng ràng buộc toàn vẹn thay vì kiểm tra ở tầng ứng dụng ngay cả ở mức cô lập
giao dịch cao nhất.

**Cách giải quyết.** Hệ thống xây dựng theo kiến trúc tách rời: tầng máy chủ
dùng Java 21 và Spring Boot 3.5.6, tầng giao diện dùng Angular 21, cơ sở dữ liệu
PostgreSQL 16, đóng gói bằng Docker Compose. Thanh toán đặt cọc qua mã QR theo
chuẩn VietQR với webhook tự xác nhận.

**Kết quả đạt được.** Hệ thống hoàn chỉnh với 82 thao tác trên 65 đường dẫn, 21
bảng dữ liệu dựng bởi chín migration, 20 thực thể. Bộ kiểm thử tự động gồm 136
ca trong 19 lớp chạy trên PostgreSQL thật, trong đó ba ca kiểm thử đa luồng
chứng minh trực tiếp rằng hệ thống không bán trùng phòng; lần chạy đầy đủ gần
nhất xanh 129 ca, bảy ca còn lại của lớp kiểm thử nút mô phỏng chuyển khoản mới
chỉ kiểm chứng được bằng cách gọi trực tiếp qua HTTP. Giao diện không còn lỗi vi
phạm chuẩn khả năng tiếp cận mức A và AA. Toàn hệ thống chạy được bằng ba lệnh
kèm dữ liệu minh hoạ đủ tám trạng thái đơn.

---

## Quy cách trình bày các trang đầu

Thứ tự dưới đây lấy theo chuỗi *"xếp sau trang ..."* ghi trong chính biểu mẫu
BM5, và khớp với thứ tự của bản báo cáo mẫu đã được duyệt của khoa.

| # | Trang | Quy cách |
|---|---|---|
| 1 | Bìa chính | In bìa cứng, chữ nhũ vàng. Tên trường và tên khoa bold size 16; tên đề tài bold size 18–30 tuỳ độ dài; dòng thông tin bold size 14 in hoa; dòng nơi — ngày bold size 13 |
| 2 | Bìa phụ (trang lót) | In giấy thường, nội dung giống bìa chính |
| 3 | LỜI MỞ ĐẦU | Bold, size 14, xếp sau trang lót |
| 4 | LỜI CẢM ƠN | Bold, size 14, xếp sau trang lời mở đầu |
| 5 | NHẬN XÉT (của cơ quan thực tập, nếu có) | Bold, size 14, xếp sau trang lời cảm ơn |
| 6 | NHẬN XÉT (của giảng viên hướng dẫn) | Bold, size 14, xếp sau trang nhận xét của cơ quan thực tập |
| 7 | BẢN NHẬN XÉT ĐỒ ÁN THỰC TẬP CHUYÊN NGÀNH (của giảng viên hướng dẫn) | Có tiêu ngữ UBND tỉnh Trà Vinh, tám mục nhận xét |
| 8 | NHẬN XÉT (của giảng viên chấm) | Bold, size 14, xếp sau trang nhận xét của giảng viên hướng dẫn |
| 9 | BẢN NHẬN XÉT ĐỒ ÁN THỰC TẬP CHUYÊN NGÀNH (của cán bộ chấm đồ án) | Có tiêu ngữ, ba phần I/II/III |
| 10 | MỤC LỤC | Bold size 14. In đậm và in hoa tiêu đề chương và mục lớn. Tiểu mục **không quá 04 cấp** |
| 11 | DANH MỤC CÁC BẢNG, SƠ ĐỒ, HÌNH | In đậm, in hoa, size 14, xếp sau trang mục lục |
| 12 | KÍ HIỆU CÁC CỤM TỪ VIẾT TẮT | Size 14, xếp sau trang danh mục. Xếp theo thứ tự bảng chữ cái |
| 13 | TÓM TẮT ĐỒ ÁN | Mục 2 "BỐ CỤC" của quy định đòi trang này; BM5 không có mẫu riêng nên trình bày như một trang văn |

Các trang đầu **không đánh số**; phần nội dung đánh số Ả Rập bắt đầu lại từ 1,
đặt ở chân trang bên phải. Nhờ vậy số trang trong mục lục không đổi khi số
trang đầu thay đổi.

Bảng, sơ đồ, hình đánh số theo chương: chữ số thứ nhất chỉ chương, chữ số thứ
hai chỉ thứ tự trong chương. Cuối mỗi cái phải có chú thích **nêu rõ nguồn
trích hoặc sao chụp**.
