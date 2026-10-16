# Bản Word của quyển báo cáo

Các tệp ở đây được **sinh ra từ `docs/bao-cao/`**, không sửa tay. Sửa nội dung
thì sửa Markdown rồi dựng lại; sửa thẳng vào `.docx` sẽ mất ở lần dựng sau.

| Tệp | Chứa gì | Số trang |
|---|---|---:|
| `bao-cao-tron-bo.docx` | **Quyển nộp** — các trang đầu theo BM5 + nội dung + tài liệu tham khảo + phụ lục | 97 |
| `bao-cao-noi-dung.docx` | Chỉ MỞ ĐẦU + Chương 1 → Chương 5 — **phần bị tính trần 30–50 trang** | 47 |
| `bao-cao-tltk-phu-luc.docx` | Chỉ tài liệu tham khảo + phụ lục A–R — *không tính vào số trang* | 30 |
| `de-cuong-do-an.docx` | **Đề cương** nộp cho GVHD *trước* khi làm — không thuộc quyển báo cáo | 16 |
| `de-cuong-xem-truoc.png` | Ảnh xem nhanh các trang đề cương, không dùng để nộp | — |

Bản PDF tương ứng ở `../pdf/`.

## Dựng lại

```sh
pip install python-docx

# Quyển nộp, đủ các trang đầu
python3 scripts/xuat-ban-word.py tron-bo thesis/doc/bao-cao-tron-bo.docx \
    "ThS. Nguyễn Nhứt Lam" "Nguyễn Hồng Quân"

# Hai bản tách phần, dùng để đếm trang và để in riêng tập phụ lục
python3 scripts/xuat-ban-word.py noi-dung thesis/doc/bao-cao-noi-dung.docx \
    "ThS. Nguyễn Nhứt Lam" "Nguyễn Hồng Quân"
python3 scripts/xuat-ban-word.py phu-luc thesis/doc/bao-cao-tltk-phu-luc.docx \
    "ThS. Nguyễn Nhứt Lam" "Nguyễn Hồng Quân"

# Đề cương — truyền thẳng đường dẫn tệp Markdown
python3 scripts/xuat-ban-word.py docs/de-cuong-do-an.md thesis/doc/de-cuong-do-an.docx
```

Không truyền hai tham số cuối thì chân trang để dấu chấm cho điền tay.

Chế độ `tron-bo` cần `libreoffice` và `pdftotext` vì nó phải **dán thử rồi đo**
mới biết mỗi mục rơi vào trang nào. Ba chế độ còn lại chỉ cần `python-docx`.

Script đã áp sẵn: Times New Roman 13pt, giãn dòng 1.5, cách đoạn trước và sau
6pt, khổ A4, lề trên 2cm – dưới 2cm – trái 3cm – phải 2cm, số trang góc phải
dưới, chân trang `GVHD:` bên trái và `SVTH:` bên phải. Hình được chèn theo dấu
chỗ đặt `[Hình X.Y]` kèm chú thích và dòng nguồn.

## Mười ba trang đầu dựng tự động

`bao-cao-tron-bo.docx` đã có sẵn, theo đúng thứ tự của biểu mẫu BM5: bìa chính,
bìa phụ, lời mở đầu, lời cảm ơn, nhận xét của cơ quan thực tập, nhận xét của
giảng viên hướng dẫn, bản nhận xét của giảng viên hướng dẫn, nhận xét của giảng
viên chấm, bản nhận xét của cán bộ chấm, mục lục, danh mục bảng–sơ đồ–hình, ký
hiệu các cụm từ viết tắt, tóm tắt đồ án.

Mười ba trang đó chiếm 20 trang giấy — mục lục dài 5 trang, danh mục 2 trang.

Thông tin cá nhân in trên bìa và trên các bản nhận xét lấy từ khối chú thích ở
đầu `docs/bao-cao/00-phan-dau.md`. Sửa ở đó, đừng sửa trong mã.

Mục lục, danh mục và ký hiệu viết tắt **sinh tự động**: số trang là số đo được
trên chính bản dán thử, không gõ tay, nên không lệch. Các trang đầu không đánh
số; phần nội dung đánh số Ả Rập bắt đầu lại từ 1.

## Còn phải làm tay

1. **In bìa chính** trên bìa cứng, chữ nhũ vàng — việc của nhà in.
2. **Khoá học** đang để `2023–2027`, suy từ mã lớp `DX23TT11`. Kiểm lại trước
   khi nộp; sai thì sửa dòng `<!-- khoa-hoc: ... -->`.
3. **Nơi và ngày trên bìa** đang để `TP. Hồ Chí Minh, tháng 10 năm 2026`, khớp
   với đề cương đã nộp và với bản báo cáo mẫu của khoa. Đổi tháng khi nộp thì
   sửa dòng `<!-- noi-ngay: ... -->`.
4. **Hình 1.3** là tuỳ chọn, chưa có. Xem `docs/images/bao-cao/README.md`.
