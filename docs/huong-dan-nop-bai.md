# Nộp bài — việc đã xong và việc còn phải tự làm

Theo mục 6.3 của hướng dẫn học phần (SSM200_IT303_v1.0023111223).

> **Trả lời ngắn cho câu "chỉ cần chuẩn bị file thuyết trình là được đúng
> không": KHÔNG.** Hướng dẫn đòi **bốn** thứ. Video thuyết trình đã quay xong
> và đã kiểm (xem bên dưới); còn lại **nộp bản mềm lên LMS** và **nộp bản cứng
> rồi ký tên tại điểm thi** — hai việc không ai làm thay được.

## Bốn thứ hướng dẫn đòi

| # | Việc | Trạng thái |
|---|---|---|
| 1 | Bản mềm nộp hệ thống LMS | Tệp nén đã dựng sẵn — xem bên dưới |
| 2 | **Nộp bản cứng tại điểm thi và ký tên xác nhận danh sách thi** | ❗ Chỉ bạn làm được |
| 3 | Nộp lại file nguồn — source code trên LMS | Đã có liên kết kho mã nguồn trong tệp nén |
| 4 | Bài thuyết trình trên LMS (PowerPoint + video) | Xong — video đã quay, đã tải lên Drive, liên kết đã dán vào slide 27 |

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
├── Ban thuyet trinh - Nguyen Hong Quan.pptx  ← 28 slide, đã có liên kết video
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

## Video thuyết trình — đã xong, đã kiểm

Video đã quay và đã tải lên Google Drive. Liên kết đã dán vào **slide 27 —
"Liên kết"** của bản thuyết trình, và tệp nén nộp LMS đã dựng lại để mang bản
PowerPoint có liên kết đó.

Liên kết: `drive.google.com/file/d/1ROd5S2zjg6JL-6JjTNNbQqxwpGj-5YCJ/view`

Những gì đã **đo trên chính tệp video tải về từ liên kết đó**, không phải tin
theo lời:

| Hướng dẫn đòi | Đo được |
|---|---|
| Người ngoài mở được liên kết | Tải ẩn danh được trọn tệp — `200`, `video/mp4`, 28,5 MB. Không hiện màn hình xin quyền |
| Thấy khuôn mặt người nói | Có, ô webcam góc trên phải suốt cả video — 181×134 điểm ảnh, bằng 0,60% khung hình |
| Thấy file PowerPoint | Có, slide chiếm gần trọn khung 2560×1570 |
| Tiếng rõ, không tạp âm | Độ to −20,6 LUFS, đỉnh thật −3,6 dBFS nên không vỡ tiếng; không có quãng lặng nào dài quá 3 giây |
| Nói hết bài | 17 phút 51 giây, chạy từ slide bìa tới slide cảm ơn |

Hai chỗ **không sửa được nữa mà cũng không cần sửa**:

- **Phút 16:07–16:39 trong video vẫn hiện dòng «DÁN LIÊN KẾT GOOGLE DRIVE VÀO
  ĐÂY».** Không tránh được: phải quay xong mới có video để tải lên, mới có liên
  kết để dán. Hướng dẫn đòi liên kết nằm trong **tệp PowerPoint nộp lên LMS** —
  chỗ đó đã có liên kết thật. Chỉ ai xem lại video mới thấy dòng cũ.
- Video quay trong cửa sổ WPS Office nên còn thanh tiêu đề ở trên và thanh
  trạng thái ở dưới. Không vi phạm điều nào trong hướng dẫn.

Muốn hết cả hai thì phải quay lại từ đầu bằng chế độ trình chiếu toàn màn hình.
Không đáng, vì không yêu cầu nào đang bị vi phạm.

## Hai việc còn lại bạn phải tự làm

### 1. Nộp bản mềm lên LMS, tuần 7

Nộp tệp nén ở "Nơi nộp bài Tuần 7". **Không nhờ người khác nộp hộ** — hướng dẫn
ghi rõ. Nộp bản mềm xong thì mới có tên trong danh sách thi.

### 2. In bản cứng, mang tới điểm thi, ký tên

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

## Còn lại đúng hai bước

1. Kiểm dòng `<!-- khoa-hoc: 2023–2027 -->` ở đầu `docs/bao-cao/00-phan-dau.md`
   — nếu sai thì sửa rồi dựng lại quyển báo cáo và chạy lại
   `./scripts/dong-goi-nop-bai.sh`.
2. Nộp `thesis/nop-bai/170123592_Nguyen Hong Quan_DX23TT11.zip` lên LMS tuần 7,
   rồi in bản cứng mang đi nộp và ký tên.

Thiếu bước nộp bản cứng và ký tên là phải đăng ký thi lại — xem lại hai lưu ý
in đỏ ở đầu trang này.
