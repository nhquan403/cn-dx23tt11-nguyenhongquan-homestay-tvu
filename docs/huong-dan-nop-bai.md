# Nộp bài — việc đã xong và việc còn phải tự làm

Theo mục 6.3 của hướng dẫn học phần (SSM200_IT303_v1.0023111223).

> **Trả lời ngắn cho câu "chỉ cần chuẩn bị file thuyết trình là được đúng
> không": KHÔNG.** Hướng dẫn đòi **bốn** thứ, trong đó có hai thứ không ai làm
> thay được: **quay video có mặt người nói**, và **nộp bản cứng rồi ký tên tại
> điểm thi**.

## Bốn thứ hướng dẫn đòi

| # | Việc | Trạng thái |
|---|---|---|
| 1 | Bản mềm nộp hệ thống LMS | Tệp nén đã dựng sẵn — xem bên dưới |
| 2 | **Nộp bản cứng tại điểm thi và ký tên xác nhận danh sách thi** | ❗ Chỉ bạn làm được |
| 3 | Nộp lại file nguồn — source code trên LMS | Đã có liên kết kho mã nguồn trong tệp nén |
| 4 | Bài thuyết trình trên LMS (PowerPoint + video) | PowerPoint xong; ❗ **video phải tự quay** |

Hai lưu ý in đỏ trong hướng dẫn, chép lại nguyên ý:

- **Chỉ nộp bản cứng mà không nộp bản mềm trên LMS** sẽ coi như **không hoàn
  thành nhiệm vụ học tập**.
- **Không nộp bản cứng và ký tên** sẽ phải **đăng ký thi lại** và nộp lại báo
  cáo theo thời gian, địa điểm trên lịch thi.

Nói cách khác, thiếu một trong hai là hỏng cả học phần — không phải trừ điểm.

## Tệp nén nộp LMS

Hệ thống **chỉ cho nộp một tệp duy nhất**. Tệp đó đã dựng sẵn:

```
thesis/nop-bai/170123592_Nguyen Hong Quan_DX23TT11.zip   (17 MB)
├── Bao cao do an - Nguyen Hong Quan.docx     ← quyển báo cáo 98 trang
├── Ban thuyet trinh - Nguyen Hong Quan.pptx  ← 21 slide
└── Lien ket ma nguon.txt                     ← liên kết kho mã nguồn
```

Tên tệp theo đúng khuôn `Mã số sinh viên_Ho ten_Ma lop.zip` mà hướng dẫn quy
định. Tên để **không dấu** cho chắc ăn khi tải lên; ví dụ trong hướng dẫn có
dấu, nên nếu quản lý học tập của bạn yêu cầu đúng như ví dụ thì cứ đổi tên lại,
nội dung bên trong không đổi.

Dựng lại tệp nén:

```sh
./scripts/dong-goi-nop-bai.sh
```

Kịch bản này **chặn** nếu bản thuyết trình còn chỗ trống chưa dán liên kết
video — đúng thứ mà hướng dẫn bắt buộc phải có.

## Bốn việc bạn phải tự làm

### 1. Quay video thuyết trình

Hướng dẫn đòi clip **thể hiện được khuôn mặt của bạn và file PowerPoint** —
nên không dùng lại được bản trình diễn hệ thống đã quay sẵn trong
`thesis/abs/demo-homestay-tvh.mp4`; bản đó chỉ có màn hình, không có mặt người
nói. Đó là video *trình diễn sản phẩm*, không phải video *thuyết trình*.

Công cụ hướng dẫn gợi ý: quay bằng điện thoại, hoặc Teams/Zoom/Camtasia, hoặc
PowerPoint 365 dùng **Record** kèm **Cameo** (Cameo chèn khuôn mặt vào góc
slide — hợp nhất với yêu cầu "thấy cả mặt và cả slide").

Lời cần nói cho từng slide đã có sẵn ở hai nơi:

- `thesis/pdf/kich-ban-bao-ve.pdf` — 6 trang, in ra cầm theo;
- phần **ghi chú người trình bày** của chính tệp PowerPoint — mở chế độ người
  trình bày là thấy lời nói ngay dưới slide.

Yêu cầu về tiếng: âm thanh ổn định, rõ ràng, **không bị tạp âm**. Quay ở phòng
kín, tắt quạt, điện thoại để im lặng.

### 2. Tải video lên Google Drive và dán liên kết vào PowerPoint

Hướng dẫn chỉ rõ: tải lên **Google Drive Student Private Drive**, rồi **gắn
liên kết vào PowerPoint**.

Trong tệp PowerPoint, mở **slide 20 — "Liên kết"**, thay dòng

> Video thuyết trình: **«DÁN LIÊN KẾT GOOGLE DRIVE VÀO ĐÂY»**

bằng liên kết thật. **Nhớ mở quyền xem cho người có liên kết**, nếu không thầy
cô bấm vào sẽ hiện màn hình xin quyền.

Dán xong thì chạy lại `./scripts/dong-goi-nop-bai.sh` để tệp nén mang bản
PowerPoint đã có liên kết.

### 3. Nộp bản mềm lên LMS, tuần 7

Nộp tệp nén ở "Nơi nộp bài Tuần 7". **Không nhờ người khác nộp hộ** — hướng dẫn
ghi rõ. Nộp bản mềm xong thì mới có tên trong danh sách thi.

### 4. In bản cứng, mang tới điểm thi, ký tên

In `thesis/pdf/bao-cao-tron-bo.pdf` (98 trang), đóng quyển, **bìa chính in bìa
cứng chữ nhũ vàng** theo biểu mẫu BM5. Mang tới đúng thời gian và địa điểm trên
lịch thi, ký tên xác nhận vào danh sách.

## Hai chỗ nên kiểm lại trước khi nộp

**Lớp của bạn không có trong bảng hỗ trợ học tập.** Bảng ở mục 7 liệt kê
DX23TT9, DX22TT5 (cô Lê Thị Hằng) và DX23TT12 (cô Trần Thị Khánh Linh). Lớp
**DX23TT11** không nằm trong bảng đó. Nhắn hỏi một trong hai cô để biết ai phụ
trách lớp mình, đừng đoán.

**Khoá học trên bìa** đang để `2023–2027`, suy ra từ mã lớp chứ không có nguồn
nào trong kho xác nhận. Kiểm lại rồi sửa dòng `<!-- khoa-hoc: ... -->` ở đầu
`docs/bao-cao/00-phan-dau.md` nếu sai, và dựng lại quyển báo cáo.

## Thứ tự làm cho đỡ phải lặp

1. Kiểm khoá học trên bìa → dựng lại quyển báo cáo nếu phải sửa.
2. Tập nói theo kịch bản, bấm giờ. Hội đồng cho 10–20 phút *kể cả hỏi đáp*.
3. Quay video (mặt + slide), nghe lại xem tiếng có rõ không.
4. Tải lên Google Drive, mở quyền xem, chép liên kết.
5. Dán liên kết vào slide "Liên kết".
6. Chạy `./scripts/dong-goi-nop-bai.sh`.
7. Nộp tệp nén lên LMS.
8. In bản cứng, mang đi nộp và ký tên.

Bước 6 phải sau bước 5, nếu không tệp nộp sẽ thiếu liên kết video.
