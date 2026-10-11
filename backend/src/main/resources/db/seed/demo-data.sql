-- ============================================================================
-- Dữ liệu mẫu cho profile `demo`.
--
-- KHÔNG phải migration Flyway, và đó là quyết định có chủ ý. Nếu tệp này là
-- V900 thì chạy `demo` rồi đổi sang `prod` trên cùng volume sẽ làm Flyway thấy
-- một migration đã áp dụng nhưng không resolve được trên classpath;
-- validateOnMigrate chặn khởi động và container rơi vào vòng restart. Seed cũng
-- không thuộc về lịch sử schema: hai vòng đời khác nhau, đừng trộn.
--
-- Chạy bởi DemoDataSeeder (ApplicationRunner, @Profile("demo")) SAU khi Flyway
-- xong, trong MỘT giao dịch. Mọi câu lệnh phải idempotent: seeder chạy lại mỗi
-- lần container khởi động.
--
-- MỌI NGÀY ĐỀU TƯƠNG ĐỐI (CURRENT_DATE ± n). Ngày tuyệt đối làm dữ liệu cũ đi
-- theo thời gian: sau vài tháng biểu đồ doanh thu 6 tháng gần nhất thành trống.
-- ============================================================================

-- ON CONFLICT DO NOTHING viết KHÔNG kèm tên cột là có chủ ý. Chỉ định một cột
-- thì PostgreSQL chỉ bỏ qua va chạm ở đúng ràng buộc đó: room_types có UNIQUE
-- trên cả `code` lẫn `slug`, nên `ON CONFLICT (code)` vẫn chết vì slug trùng —
-- và chết ở đây nghĩa là cả ứng dụng không khởi động được.

-- ─── Tiện ích ───────────────────────────────────────────────────────────────
INSERT INTO amenities (code, name, icon, category, display_order) VALUES
    ('wifi',         'Wifi miễn phí',         'wifi',          'ROOM',      1),
    ('dieu-hoa',     'Điều hoà',              'dieu-hoa',      'ROOM',      2),
    ('nuoc-nong',    'Nước nóng',             'nuoc-nong',     'ROOM',      3),
    ('tv',           'TV màn hình phẳng',     'tv',            'ROOM',      4),
    ('tu-lanh',      'Tủ lạnh mini',          'tu-lanh',       'ROOM',      5),
    ('ban-cong',     'Ban công riêng',        'ban-cong',      'ROOM',      6),
    ('ban-lam-viec', 'Bàn làm việc',          'ban-lam-viec',  'ROOM',      7),
    ('bai-do-xe',    'Bãi đỗ xe miễn phí',    'bai-do-xe',     'PROPERTY',  1),
    ('bua-sang',     'Bữa sáng nhà nấu',      'bua-sang',      'PROPERTY',  2),
    ('san-vuon',     'Sân vườn ven sông',     'san-vuon',      'PROPERTY',  3),
    ('xe-dap',       'Cho thuê xe đạp',       'xe-dap',        'PROPERTY',  4),
    ('le-tan',       'Lễ tân 24/7',           'le-tan',        'PROPERTY',  5)
ON CONFLICT DO NOTHING;

-- ─── Loại phòng ─────────────────────────────────────────────────────────────
INSERT INTO room_types
    (code, slug, name, short_description, description, base_price,
     capacity_adults, capacity_children, bed_info, area_sqm, display_order, active)
VALUES
    ('STANDARD', 'phong-standard', 'Phòng Standard',
     'Gọn gàng, đủ tiện nghi, giá dễ chịu nhất của homestay.',
     E'Phòng ở tầng trệt, cửa sổ mở ra lối đi có giàn hoa giấy.\nCó bàn làm việc nhỏ và ổ cắm cạnh giường — phù hợp khách đi công tác ngắn ngày.\n\nPhòng tắm riêng, nước nóng năng lượng mặt trời.',
     500000, 2, 1, '1 giường đôi', 18, 1, true),

    ('DELUXE', 'phong-deluxe', 'Phòng Deluxe hướng vườn',
     'Rộng hơn Standard, ban công nhìn thẳng ra vườn.',
     E'Phòng tầng hai, ban công riêng nhìn ra vườn xoài phía sau nhà.\nBuổi sáng có tiếng chim, buổi tối nghe rõ tiếng dế ngoài mương.\n\nCó tủ lạnh mini và ấm đun nước.',
     750000, 2, 2, '1 giường đôi lớn', 26, 2, true),

    ('FAMILY', 'phong-gia-dinh', 'Phòng gia đình',
     'Hai giường đôi, đủ chỗ cho cả nhà bốn đến sáu người.',
     E'Phòng rộng nhất trong nhà chính, có bàn ăn nhỏ và tủ lạnh.\nGiường thấp và không có bậc thềm trong phòng, phù hợp gia đình có trẻ nhỏ.\n\nCó thể kê thêm nệm phụ, báo trước khi nhận phòng.',
     1200000, 4, 2, '2 giường đôi', 38, 3, true),

    ('BUNGALOW', 'bungalow-ven-song', 'Bungalow ven sông',
     'Nhà gỗ tách biệt, hiên riêng nhìn ra sông.',
     E'Căn nhà gỗ đứng riêng cuối vườn, cách nhà chính khoảng ba mươi bước.\nHiên trước có võng và bàn trà, nhìn thẳng ra nhánh sông nhỏ.\n\nYên tĩnh nhất khu; cũng là nơi xa bếp nhất, nên bữa sáng được mang tới tận hiên.',
     1500000, 3, 1, '1 giường đôi lớn + 1 giường đơn', 45, 4, true)
ON CONFLICT DO NOTHING;

-- ─── Ảnh loại phòng ─────────────────────────────────────────────────────────
-- Đường dẫn tương đối tới ảnh nằm trong repo (frontend/public/images/demo/),
-- không phải URL của một máy chủ ảnh bên ngoài: bản đem đi bảo vệ không được
-- phụ thuộc vào việc máy chủ của người khác còn sống hay không, và cũng không
-- được phụ thuộc vào việc phòng bảo vệ có mạng hay không.
INSERT INTO room_type_images (room_type_id, url, alt_text, display_order, is_cover)
SELECT rt.id, v.url, v.alt_text, v.display_order, v.is_cover
  FROM room_types rt
  JOIN (VALUES
        ('STANDARD',  '/images/demo/standard-1.jpg',  'Phòng Standard nhìn từ cửa vào',      0, true),
        ('STANDARD',  '/images/demo/standard-2.jpg',  'Góc đầu giường phòng Standard', 1, false),
        ('DELUXE',    '/images/demo/deluxe-1.jpg',    'Phòng Deluxe nhìn từ cửa vào', 0, true),
        ('DELUXE',    '/images/demo/deluxe-2.jpg',    'Góc ngồi bên cửa sổ phòng Deluxe',      1, false),
        ('DELUXE',    '/images/demo/deluxe-3.jpg',    'Phòng tắm riêng của phòng Deluxe',     2, false),
        ('FAMILY',    '/images/demo/family-1.jpg',    'Phòng gia đình với hai giường đôi',    0, true),
        ('FAMILY',    '/images/demo/family-2.jpg',    'Phòng gia đình nhìn ra vườn',      1, false),
        ('BUNGALOW',  '/images/demo/bungalow-1.jpg',  'Dãy bungalow mái lá bên mặt nước',     0, true),
        ('BUNGALOW',  '/images/demo/bungalow-2.jpg',  'Bungalow tre giữa vườn cây',     1, false)
       ) AS v(code, url, alt_text, display_order, is_cover) ON v.code = rt.code
 WHERE NOT EXISTS (
       SELECT 1 FROM room_type_images x WHERE x.room_type_id = rt.id AND x.url = v.url);

-- ─── Gán tiện ích cho loại phòng ────────────────────────────────────────────
-- Tiện ích PROPERTY gắn cho mọi loại phòng: đó là cách lược đồ diễn đạt "tiện
-- ích của cả homestay" — không có bảng riêng cho nhóm này.
INSERT INTO room_type_amenities (room_type_id, amenity_id)
SELECT rt.id, a.id FROM room_types rt CROSS JOIN amenities a
 WHERE a.category = 'PROPERTY'
ON CONFLICT DO NOTHING;

INSERT INTO room_type_amenities (room_type_id, amenity_id)
SELECT rt.id, a.id FROM room_types rt CROSS JOIN amenities a
 WHERE a.code IN ('wifi', 'dieu-hoa', 'nuoc-nong')
ON CONFLICT DO NOTHING;

INSERT INTO room_type_amenities (room_type_id, amenity_id)
SELECT rt.id, a.id FROM room_types rt CROSS JOIN amenities a
 WHERE rt.code = 'STANDARD' AND a.code IN ('ban-lam-viec')
ON CONFLICT DO NOTHING;

INSERT INTO room_type_amenities (room_type_id, amenity_id)
SELECT rt.id, a.id FROM room_types rt CROSS JOIN amenities a
 WHERE rt.code IN ('DELUXE', 'FAMILY', 'BUNGALOW')
   AND a.code IN ('tv', 'tu-lanh', 'ban-cong')
ON CONFLICT DO NOTHING;

-- ─── Phòng vật lý: 5 + 4 + 3 + 3 = 15 ───────────────────────────────────────
INSERT INTO rooms (room_type_id, room_number, floor, status)
SELECT rt.id, v.room_number, v.floor, v.status
  FROM room_types rt
  JOIN (VALUES
        ('STANDARD', '101', 1, 'AVAILABLE'),
        ('STANDARD', '102', 1, 'AVAILABLE'),
        ('STANDARD', '103', 1, 'AVAILABLE'),
        ('STANDARD', '104', 1, 'AVAILABLE'),
        ('STANDARD', '105', 1, 'MAINTENANCE'),
        ('DELUXE',   '201', 2, 'AVAILABLE'),
        ('DELUXE',   '202', 2, 'AVAILABLE'),
        ('DELUXE',   '203', 2, 'AVAILABLE'),
        ('DELUXE',   '204', 2, 'AVAILABLE'),
        ('FAMILY',   '301', 3, 'AVAILABLE'),
        ('FAMILY',   '302', 3, 'AVAILABLE'),
        ('FAMILY',   '303', 3, 'AVAILABLE'),
        ('BUNGALOW', 'B01', 1, 'AVAILABLE'),
        ('BUNGALOW', 'B02', 1, 'AVAILABLE'),
        ('BUNGALOW', 'B03', 1, 'AVAILABLE')
       ) AS v(code, room_number, floor, status) ON v.code = rt.code
ON CONFLICT DO NOTHING;

-- ─── Khuyến mãi: còn hạn, hết hạn, hết lượt, đã tắt ────────────────────────
INSERT INTO promotions (code, name, description, discount_type, discount_value,
                        max_discount_amount, min_nights, min_total_amount,
                        starts_at, ends_at, usage_limit, used_count, active)
VALUES
    ('CHAOBAN10', 'Chào bạn mới', 'Giảm 10% cho đơn từ 2 đêm, tối đa 300.000đ.',
     'PERCENT', 10, 300000, 2, 0,
     now() - interval '30 days', now() + interval '180 days', NULL, 0, true),

    ('TET2026', 'Ưu đãi Tết', 'Giảm 200.000đ cho đơn từ 3 đêm. Đã hết hạn.',
     'FIXED', 200000, NULL, 3, 1500000,
     now() - interval '200 days', now() - interval '120 days', NULL, 14, true),

    ('SINHNHAT', 'Sinh nhật homestay', 'Giảm 15%, giới hạn 20 lượt. Đã dùng hết.',
     'PERCENT', 15, 500000, 1, 0,
     now() - interval '60 days', now() + interval '60 days', 20, 20, true),

    ('DAIHAN5', 'Ở dài ngày', 'Giảm 5% cho đơn từ 4 đêm, không giới hạn lượt.',
     'PERCENT', 5, 400000, 4, 0,
     now() - interval '90 days', now() + interval '270 days', NULL, 37, true),

    ('HEDO150', 'Hè mát', 'Giảm thẳng 150.000đ cho đơn từ 2 đêm.',
     'FIXED', 150000, NULL, 2, 1000000,
     now() - interval '15 days', now() + interval '75 days', 100, 23, true),

    -- Mã còn hạn nhưng đã TẮT. Khác hẳn "hết hạn" và "hết lượt": đây là trường
    -- hợp người quản trị chủ động ngắt một chương trình đang chạy, và nó phải
    -- bị từ chối vì `active = false` chứ không phải vì ngày tháng.
    ('NGUNG20', 'Ưu đãi đã ngừng', 'Giảm 20%, đã tạm ngừng áp dụng.',
     'PERCENT', 20, 600000, 1, 0,
     now() - interval '45 days', now() + interval '45 days', NULL, 8, false)
ON CONFLICT DO NOTHING;

-- ─── Khách hàng mẫu ─────────────────────────────────────────────────────────
-- Mật khẩu băm sẵn cho hai tài khoản KHÁCH (không phải quản trị). Chuỗi dưới
-- đây là hash BCrypt của "khachdemo123" — cố ý công khai: đây là tài khoản
-- trình diễn không có quyền gì ngoài xem đơn của chính nó, và người chấm cần
-- đăng nhập thử được. Tài khoản QUẢN TRỊ thì ngược lại: mật khẩu sinh ngẫu
-- nhiên lúc chạy và chỉ in ra log, xem DemoDataSeeder.
INSERT INTO users (email, password_hash, full_name, phone, role, enabled, must_change_password)
VALUES
    ('an.nguyen@example.com',
     '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
     'Nguyễn Thị An', '0905111222', 'CUSTOMER', true, false),
    ('binh.tran@example.com',
     '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
     'Trần Văn Bình', '0905333444', 'CUSTOMER', true, false)
ON CONFLICT DO NOTHING;

-- ─── Nội dung trang chủ ─────────────────────────────────────────────────────
INSERT INTO site_contents (section_key, title, subtitle, body, image_url) VALUES
    ('hero', 'Homestay TVH', 'Nghỉ ngơi giữa miền Tây sông nước',
     '<p>Bốn loại phòng nhìn ra vườn và ra sông, cách trung tâm Trà Vinh mười phút đi xe.</p>',
     '/images/demo/hero.jpg'),

    ('about', 'Về Homestay TVH', 'Một nơi để thở chậm lại',
     '<p>Homestay TVH là nhà của chúng tôi, mở cửa đón khách phương xa từ năm 2019. Vườn sau nhà trồng xoài và dừa, có lối nhỏ dẫn ra bến sông.</p><p>Bữa sáng là món nhà nấu — bún nước lèo, bánh tét, hoặc cháo cá tuỳ ngày. Chủ nhà nấu, không đặt ngoài.</p><ul><li>Đón khách tại bến xe Trà Vinh nếu báo trước</li><li>Cho thuê xe đạp đi vòng cù lao</li><li>Nhận giữ hành lý sau khi trả phòng</li></ul>',
     '/images/demo/about.jpg'),

    ('contact', 'Liên hệ', 'Chúng tôi luôn sẵn sàng trả lời',
     '<p>Điện thoại: 0294 3855 246<br />Email: lienhe@homestaytvh.vn</p><p>Nhận phòng từ 14:00, trả phòng trước 12:00. Nhận phòng muộn xin báo trước để chúng tôi chờ cửa.</p>',
     NULL),

    ('map', 'Đường tới homestay', 'Ấp Long Trị, xã Long Đức, TP. Trà Vinh',
     '<p>Từ trung tâm thành phố đi theo đường Phạm Ngũ Lão về hướng bắc khoảng 4km, qua cầu Long Bình rồi rẽ phải vào đường đất đỏ, đi thêm 300m là tới cổng.</p>',
     '/images/demo/map.svg')
ON CONFLICT DO NOTHING;

-- ─── Banner ─────────────────────────────────────────────────────────────────
INSERT INTO banners (title, image_url, link_url, display_order, active, starts_at, ends_at)
SELECT v.title, v.image_url, v.link_url, v.display_order, v.active,
       v.starts_at, v.ends_at
  FROM (VALUES
        ('Giảm 10% cho khách đặt lần đầu', '/images/demo/banner-1.jpg', '/phong',
         0, true, now() - interval '10 days', now() + interval '120 days'),
        ('Đặt 3 đêm, tặng một buổi đi xe đạp vòng cù lao', '/images/demo/banner-2.jpg', '/phong/bungalow-ven-song',
         1, true, now() - interval '5 days', now() + interval '90 days'),
        ('Ưu đãi Tết đã kết thúc', '/images/demo/banner-3.jpg', NULL,
         2, false, now() - interval '200 days', now() - interval '120 days')
       ) AS v(title, image_url, link_url, display_order, active, starts_at, ends_at)
 WHERE NOT EXISTS (SELECT 1 FROM banners b WHERE b.title = v.title);

-- ─── Thư viện ảnh ───────────────────────────────────────────────────────────
INSERT INTO gallery_images (url, caption, category, display_order, active)
SELECT v.url, v.caption, v.category, v.display_order, true
  FROM (VALUES
        ('/images/demo/gallery-1.jpg', 'Lối đi giữa hai hàng cau',            'khong-gian', 0),
        ('/images/demo/gallery-2.jpg', 'Bến sông cuối vườn',                  'khong-gian', 1),
        ('/images/demo/gallery-7.jpg', 'Con rạch nhỏ giữa hai hàng dừa nước', 'khong-gian', 2),
        ('/images/demo/gallery-3.jpg', 'Phở sáng nấu tại bếp nhà',            'am-thuc',    3),
        ('/images/demo/gallery-4.jpg', 'Bàn ăn chung ngoài hiên',             'am-thuc',    4),
        ('/images/demo/gallery-5.jpg', 'Xe đạp cho khách mượn',               'trai-nghiem',5),
        ('/images/demo/gallery-8.jpg', 'Đi xuồng len lỏi trong rạch dừa nước','trai-nghiem',6),
        ('/images/demo/gallery-6.jpg', 'Võng mắc ven nước lúc hoàng hôn',     'trai-nghiem',7)
       ) AS v(url, caption, category, display_order)
 WHERE NOT EXISTS (SELECT 1 FROM gallery_images g WHERE g.url = v.url);

-- ─── Bài viết ───────────────────────────────────────────────────────────────
INSERT INTO posts (slug, title, excerpt, content, cover_image_url, published, published_at)
VALUES
    ('di-tra-vinh-mua-nao-dep',
     'Đi Trà Vinh mùa nào đẹp nhất?',
     'Tháng 10 đến tháng 2 trời mát và ít mưa. Đây là vài điều nên biết trước khi đặt vé.',
     '<h2>Mùa khô: tháng 11 đến tháng 4</h2><p>Trời mát, đường đất khô ráo, đạp xe vòng cù lao dễ chịu nhất trong năm. Đây cũng là mùa đông khách nên nên đặt phòng sớm.</p><h2>Mùa mưa: tháng 5 đến tháng 10</h2><p>Mưa thường đổ vào chiều và tạnh nhanh. Vườn xanh hơn, khách vắng hơn, và giá phòng dễ chịu hơn.</p><h3>Vài ngày đáng chú ý</h3><ul><li><strong>Lễ Chôl Chnăm Thmây</strong> (giữa tháng 4) — các chùa Khmer trong vùng rất đông vui</li><li><strong>Lễ Ok Om Bok</strong> (rằm tháng 10 âm lịch) — đua ghe ngo trên sông Long Bình</li></ul>',
     '/images/demo/post-1.jpg', true, now() - interval '12 days'),

    ('nhung-mon-nen-an-o-tra-vinh',
     'Năm món nên ăn khi tới Trà Vinh',
     'Bún nước lèo, bánh canh Bến Có, cháo ám... và chỗ ăn ngon mà người địa phương hay đi.',
     '<h2>Bún nước lèo</h2><p>Món phải thử đầu tiên. Nước lèo nấu từ mắm bò hóc, ăn kèm heo quay và rau sống.</p><h2>Bánh canh Bến Có</h2><p>Cách homestay khoảng 8km. Nên đi buổi sáng sớm, quán hết hàng trước trưa.</p><h2>Cháo ám</h2><p>Cháo cá lóc ăn với rau ghém và mắm nêm. Mỗi nhà nấu một kiểu.</p><blockquote>Chủ nhà sẵn lòng chỉ đường và gọi xe ôm quen nếu bạn hỏi.</blockquote>',
     '/images/demo/post-2.jpg', true, now() - interval '30 days'),

    ('dap-xe-vong-cu-lao-long-tri',
     'Đạp xe một vòng cù lao Long Trị',
     'Cung đường 12km men theo sông, đi hết chừng hai tiếng kể cả dừng chụp ảnh.',
     '<h2>Cung đường</h2><p>Từ cổng homestay rẽ trái, đi men theo bờ sông khoảng 4km tới chùa Khmer, rồi vòng qua cầu nhỏ về phía vườn dừa.</p><h2>Nên đi lúc nào</h2><p>Sáng sớm trước 8 giờ hoặc chiều sau 16 giờ. Giữa trưa nắng gắt và không có bóng cây trên đoạn đê.</p><h2>Mang theo gì</h2><ul><li>Nước — dọc đường chỉ có một quán tạp hoá</li><li>Mũ và kem chống nắng</li><li>Tiền lẻ nếu muốn ghé đò ngang</li></ul>',
     '/images/demo/post-3.jpg', true, now() - interval '45 days'),

    ('di-xuong-trong-rach-dua-nuoc',
     'Đi xuồng trong rạch dừa nước — nên đi giờ nào',
     'Rạch sau nhà nối ra sông lớn. Đi lúc nước lớn thì xuồng vào được tận gốc dừa.',
     '<h2>Phụ thuộc con nước, không phụ thuộc giờ</h2><p>Nước lớn thì xuồng len được vào rạch nhỏ; nước ròng thì mắc cạn. Chủ nhà xem lịch con nước giúp nếu bạn báo trước một ngày.</p><h2>Mang gì</h2><ul><li>Nón — trong rạch rợp nhưng đoạn ra sông lớn thì nắng gắt</li><li>Túi chống nước cho điện thoại</li><li>Áo phao có sẵn trên xuồng, bắt buộc mặc</li></ul><h2>Bao lâu</h2><p>Một vòng chừng 45 phút. Muốn ghé vườn trái cây bên kia sông thì tính hai tiếng.</p>',
     '/images/demo/gallery-2.jpg', true, now() - interval '6 days'),

    ('bua-sang-o-homestay-co-gi',
     'Bữa sáng ở homestay có gì',
     'Mỗi ngày một món, chủ nhà nấu. Không đặt ngoài, nên hết là hết.',
     '<h2>Xoay vòng theo ngày</h2><p>Thứ Hai và thứ Năm là bún nước lèo. Thứ Ba, thứ Sáu là bánh tét chiên với dưa chua. Cuối tuần thường là cháo cá lóc hoặc hủ tiếu.</p><h2>Ăn chay, dị ứng</h2><p>Báo trước một ngày là bếp đổi món được. Dị ứng hải sản thì nhớ nói rõ — nước lèo có mắm.</p><h2>Giờ ăn</h2><p>Từ 6h30 tới 9h ngoài hiên. Đi sớm hơn thì báo tối hôm trước, bếp gói mang theo.</p>',
     '/images/demo/gallery-4.jpg', true, now() - interval '20 days'),

    ('ba-cho-ngoi-khong-lam-gi',
     'Ba chỗ ngồi không làm gì ở homestay',
     'Không phải điểm tham quan nào cũng cần đi. Đây là ba chỗ để ngồi yên.',
     '<h2>Võng ở hiên bungalow</h2><p>Buổi chiều từ 16h trở đi có gió sông. Đây là chỗ nhiều khách nói là lý do họ quay lại.</p><h2>Bậc thềm bến sông</h2><p>Cuối vườn, ba bậc xi măng sát mé nước. Sáng sớm có người giăng lưới ngang rạch.</p><h2>Bàn trà dưới gốc xoài</h2><p>Sau nhà chính. Mùa xoài chín thì nên đội nón.</p><blockquote>Chủ nhà pha sẵn bình trà để ở bếp, khách tự rót.</blockquote>',
     '/images/demo/gallery-6.jpg', true, now() - interval '60 days'),

    ('ban-nhap-chua-dang',
     'Hướng dẫn nhận phòng sớm (bản nháp)',
     'Bài viết đang soạn, chưa đăng.',
     '<p>Nội dung đang viết dở.</p>',
     NULL, false, NULL)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- Ba kịch bản dựng tay, PHẢI chạy trước khối sinh đơn hàng loạt
--
-- Cả ba đều CHỌN phòng còn rảnh thay vì ghi cứng số phòng. Nếu ba trăm đơn
-- sinh hàng loạt chạy trước và chiếm chỗ, cả ba lặng lẽ không dựng được gì:
-- câu lệnh vẫn thành công, chỉ là chèn 0 dòng. Và ba tính năng đáng trình
-- diễn nhất của đề tài — lịch tự chặn ngày hết phòng, phòng đang đóng bị trừ
-- khỏi kết quả tìm, phòng tự mở lại khi hết hạn đóng — biến mất khỏi bản demo
-- mà không có một dòng lỗi nào.
--
-- Đảo thứ tự là cách sửa đúng. Cách sai mà bản trước dùng là bắt khối sinh đơn
-- né hẳn bốn khoảng ngày này: nó có chạy, nhưng khoảng -1..+3 chính là dải
-- ngày duy nhất sinh ra đơn CHECKED_IN, nên né nó đi là xoá sạch trạng thái
-- "khách đang ở" khỏi dữ liệu mẫu.
-- ============================================================================

-- ─── Một khoảng đóng phòng để trình diễn "ngày khả dụng" ────────────────────
-- Đặt ở +40..+45 ngày: đủ xa khoảng ngày hội đồng thường thử đặt, nên nó không
-- che mất phòng lúc trình diễn, nhưng vẫn nằm trong cửa sổ lịch mặc định.
--
-- Phòng được CHỌN chứ không ghi cứng: chọn phòng đầu tiên còn khai thác mà
-- không có đơn nào giao với khoảng đó. Ghi cứng số phòng thì chỉ cần tầng gán
-- phòng đổi thứ tự là khoảng đóng rơi trúng một đơn đã seed, và bản demo mở ra
-- với một cảnh báo "có đơn bị ảnh hưởng" mà không ai cố ý tạo.
--
-- Điều kiện cuối là chốt idempotent: đã có khoảng đóng nào thì không thêm nữa,
-- nên khởi động lại container không cộng dồn mỗi lần một khoảng.
INSERT INTO room_closures (room_id, from_date, to_date, reason)
SELECT r.id, CURRENT_DATE + 40, CURRENT_DATE + 45, 'Sơn lại phòng và thay rèm'
  FROM rooms r
 WHERE r.status = 'AVAILABLE'
   AND NOT EXISTS (
       SELECT 1 FROM booking_rooms br
        WHERE br.room_id = r.id
          AND br.status = 'ACTIVE'
          AND br.stay && daterange(CURRENT_DATE + 40, CURRENT_DATE + 45, '[)')
   )
   AND NOT EXISTS (SELECT 1 FROM room_closures)
 ORDER BY r.room_number
 LIMIT 1;

-- ─── Hai khoảng đóng phòng nữa: một ĐANG áp dụng, một ĐÃ QUA ────────────────
-- Khoảng duy nhất ở trên nằm ở +40 ngày, tức là lúc mở khu quản trị thì danh
-- sách chỉ có một dòng ở tương lai xa. Thêm một khoảng ĐANG có hiệu lực hôm
-- nay (chứng minh phòng bị trừ khỏi kết quả tìm kiếm ngay bây giờ) và một
-- khoảng ĐÃ QUA (chứng minh hệ thống tự mở lại phòng, không cần ai nhớ bật).
INSERT INTO room_closures (room_id, from_date, to_date, reason)
SELECT r.id, CURRENT_DATE - 1, CURRENT_DATE + 3, 'Máy lạnh hỏng, đang chờ thợ'
  FROM rooms r
 WHERE r.status = 'AVAILABLE'
   AND NOT EXISTS (
       SELECT 1 FROM booking_rooms br
        WHERE br.room_id = r.id AND br.status = 'ACTIVE'
          AND br.stay && daterange(CURRENT_DATE - 1, CURRENT_DATE + 3, '[)'))
   AND NOT EXISTS (
       SELECT 1 FROM room_closures rc
        WHERE rc.room_id = r.id
          AND rc.blocked && daterange(CURRENT_DATE - 1, CURRENT_DATE + 3, '[)'))
   -- Chốt idempotent: đã có khoảng nào bắt đầu trước hôm nay thì không thêm nữa.
   AND NOT EXISTS (SELECT 1 FROM room_closures WHERE from_date < CURRENT_DATE)
 ORDER BY r.room_number DESC
 LIMIT 1;

INSERT INTO room_closures (room_id, from_date, to_date, reason)
SELECT r.id, CURRENT_DATE - 20, CURRENT_DATE - 15, 'Thay toàn bộ ga gối'
  FROM rooms r
 WHERE r.status = 'AVAILABLE'
   AND NOT EXISTS (
       SELECT 1 FROM booking_rooms br
        WHERE br.room_id = r.id AND br.status = 'ACTIVE'
          AND br.stay && daterange(CURRENT_DATE - 20, CURRENT_DATE - 15, '[)'))
   AND NOT EXISTS (
       SELECT 1 FROM room_closures rc
        WHERE rc.room_id = r.id
          AND rc.blocked && daterange(CURRENT_DATE - 20, CURRENT_DATE - 15, '[)'))
   AND NOT EXISTS (SELECT 1 FROM room_closures WHERE to_date <= CURRENT_DATE)
 ORDER BY r.room_number
 LIMIT 1;

-- ─── Một cuối tuần CHÁY PHÒNG để lịch có ngày bị chặn ───────────────────────
-- Không có ngày nào hết phòng thì tính năng quan trọng nhất của đề tài — chặn
-- sẵn ngày hết phòng ngay trong lịch — không nhìn thấy được lúc trình diễn.
-- Khối này chạy TRƯỚC khối sinh đơn hàng loạt nên mọi phòng còn rảnh. Nếu để
-- nó chạy sau, càng nhiều dữ liệu mẫu thì xác suất kín được cả nhà càng thấp,
-- và lúc hỏng thì hỏng im lặng: vòng lặp đơn giản là không chạy lần nào.
--
-- Phải kín MỌI loại phòng, không phải một loại. Lịch ở bước 1 của luồng đặt
-- phòng chạy TRƯỚC khi khách chọn loại phòng nên nó gộp cả nhà lại: một ngày
-- chỉ bị chặn khi mọi loại phòng đều hết. Kín một loại thôi thì ngày đó vẫn
-- bấm chọn được, và phần trình diễn không chứng minh được điều nó định chứng
-- minh. Đặt ở +12..+14 ngày: đủ gần để mở lịch mặc định là thấy ngay, đủ xa để
-- không đụng khoảng hội đồng hay thử đặt.
DO $chay_phong$
DECLARE
    v_type       record;
    v_room       record;
    v_in         date := CURRENT_DATE + 12;
    v_out        date := CURRENT_DATE + 14;
    v_i          integer := 0;
    v_code       varchar(20);
    v_booking_id bigint;
    v_total      numeric(12,2);
    v_names      text[] := ARRAY[
        'Lý Gia Bảo', 'Trương Mỹ Duyên', 'Phan Đức Trí', 'Hồ Nhật Minh',
        'Vũ Khánh Linh', 'Đỗ Trung Kiên', 'Cao Thuỳ Trang', 'Mai Văn Lộc',
        'Tạ Bích Ngọc', 'Chu Anh Khoa', 'Lâm Tuyết Nhi', 'Đinh Hữu Phước',
        'Quách Diễm My', 'Tô Gia Hân'];
BEGIN
    -- Đã dựng rồi thì thôi: seeder chạy lại mỗi lần container khởi động.
    IF EXISTS (SELECT 1 FROM bookings WHERE code LIKE 'TVHFULL%') THEN
        RETURN;
    END IF;

    FOR v_room IN
        SELECT r.* FROM rooms r
         WHERE r.status = 'AVAILABLE'
           -- Phòng nào đã bận trong khoảng này thì bỏ qua: ràng buộc loại trừ
           -- sẽ bác, và bác ở đây nghĩa là cả ứng dụng không khởi động được.
           AND NOT EXISTS (
               SELECT 1 FROM booking_rooms br
                WHERE br.room_id = r.id AND br.status = 'ACTIVE'
                  AND br.stay && daterange(v_in, v_out, '[)'))
           AND NOT EXISTS (
               SELECT 1 FROM room_closures rc
                WHERE rc.room_id = r.id
                  AND rc.blocked && daterange(v_in, v_out, '[)'))
         ORDER BY r.room_number
    LOOP
        SELECT * INTO v_type FROM room_types WHERE id = v_room.room_type_id;
        v_i := v_i + 1;
        v_code := 'TVHFULL' || lpad(v_i::text, 2, '0');
        v_total := v_type.base_price * 2;

        INSERT INTO bookings (
            code, access_token, user_id, guest_name, guest_email, guest_phone,
            check_in, check_out, adults, children, room_type_id,
            room_type_name_snapshot, unit_price_snapshot, room_quantity,
            subtotal_amount, discount_amount, total_amount, deposit_amount,
            status, payment_status, hold_expires_at, created_at, updated_at)
        VALUES (
            v_code, md5(v_code || 'tvh-demo-seed'), NULL,
            v_names[1 + ((v_i - 1) % array_length(v_names, 1))],
            'khach.cuoituan' || v_i || '@example.com',
            '09' || lpad((10000000 + v_i * 37)::text, 8, '0'),
            v_in, v_out, LEAST(v_type.capacity_adults, 2), 0, v_type.id,
            v_type.name, v_type.base_price, 1,
            v_total, 0, v_total, round(v_total * 0.3, 0),
            'CONFIRMED', 'DEPOSIT_PAID', NULL,
            now() - interval '9 days', now() - interval '9 days')
        RETURNING id INTO v_booking_id;

        INSERT INTO booking_rooms (booking_id, room_id, check_in, check_out, status)
        VALUES (v_booking_id, v_room.id, v_in, v_out, 'ACTIVE');

        INSERT INTO booking_status_history (booking_id, from_status, to_status, actor, note, created_at)
        VALUES (v_booking_id, NULL, 'PENDING_PAYMENT', 'GUEST', 'Đơn mẫu — cuối tuần kín phòng',
                now() - interval '9 days'),
               (v_booking_id, 'PENDING_PAYMENT', 'CONFIRMED', 'SYSTEM', 'Đã nhận đủ tiền cọc',
                now() - interval '9 days' + interval '11 minutes');

        INSERT INTO payments (
            booking_id, attempt_no, provider, amount_expected, amount_received,
            transfer_content, qr_content, status, reconcile_status,
            provider_txn_id, paid_at, created_at, updated_at)
        VALUES (
            v_booking_id, 1, 'SEPAY', round(v_total * 0.3, 0), round(v_total * 0.3, 0),
            v_code || '01', 'Chuyen khoan giu cho ' || v_code,
            'SUCCEEDED', 'NONE', 'DEMOFULL' || lpad(v_i::text, 4, '0'),
            now() - interval '9 days' + interval '10 minutes',
            now() - interval '9 days', now());
    END LOOP;
END
$chay_phong$;

-- ============================================================================
-- Đơn đặt phòng
--
-- Sinh bằng vòng lặp thay vì viết tay 320 câu INSERT, vì mỗi đơn phải:
--   * chọn được đủ `room_quantity` phòng KHÔNG trùng lịch với đơn đã có —
--     nếu không, ràng buộc EXCLUDE bác ngay và seeder chết lúc khởi động;
--   * có đúng `room_quantity` dòng booking_rooms ACTIVE, nếu không hàm
--     assert_booking_room_count bác ở cuối giao dịch.
-- Truy vấn chọn phòng bên dưới là chính truy vấn mà tầng đặt phòng dùng thật.
-- Seeder chạy được chính là bằng chứng dữ liệu mẫu tôn trọng cả hai ràng buộc.
-- ============================================================================
DO $seed$
DECLARE
    v_i            integer;
    v_code         varchar(20);
    v_room_type    record;
    v_nights       integer;
    v_check_in     date;
    v_check_out    date;
    v_qty          integer;
    v_adults       integer;
    v_children     integer;
    v_status       varchar(20);
    v_pay_status   varchar(20);
    v_subtotal     numeric(12,2);
    v_discount     numeric(12,2);
    v_total        numeric(12,2);
    v_deposit      numeric(12,2);
    v_hold         timestamptz;
    v_booking_id   bigint;
    v_room_status  varchar(20);
    v_rooms        bigint[];
    v_room         bigint;
    v_user_id      bigint;
    v_guest_name   varchar(150);
    v_guest_phone  varchar(20);
    v_guest_email  varchar(255);
    -- Hai tám cái tên thay vì mười: với 320 đơn thì mười cái tên lặp lại ba
    -- mươi hai lần một cái, và danh sách đơn ở khu quản trị trông như dữ liệu
    -- bịa bằng vòng lặp — đúng bản chất, nhưng không cần phô ra.
    v_names        text[] := ARRAY[
        'Nguyễn Thị An', 'Trần Văn Bình', 'Lê Minh Châu', 'Phạm Hồng Duyên',
        'Võ Quốc Đạt', 'Đặng Thu Hà', 'Bùi Thanh Hải', 'Ngô Kim Lan',
        'Dương Văn Nam', 'Huỳnh Ngọc Oanh', 'Lý Gia Bảo', 'Trương Mỹ Duyên',
        'Phan Đức Trí', 'Hồ Nhật Minh', 'Vũ Khánh Linh', 'Đỗ Trung Kiên',
        'Cao Thuỳ Trang', 'Mai Văn Lộc', 'Tạ Bích Ngọc', 'Chu Anh Khoa',
        'Lâm Tuyết Nhi', 'Đinh Hữu Phước', 'Quách Diễm My', 'Tô Gia Hân',
        'Nguyễn Hoàng Vũ', 'Trịnh Thanh Thảo', 'Lương Bá Đạt', 'Hà Mỹ Linh'];
BEGIN
    FOR v_i IN 1..320 LOOP
        v_code := 'TVHDEMO' || lpad(v_i::text, 3, '0');

        -- Đơn đã có thì bỏ qua. Cả khối này nằm trong một giao dịch nên không
        -- có chuyện "chạy dở": hoặc toàn bộ vào, hoặc không gì vào cả.
        CONTINUE WHEN EXISTS (SELECT 1 FROM bookings WHERE code = v_code);

        -- Rải trên cửa sổ 360 ngày, từ 270 ngày trước tới 90 ngày sau: quá khứ
        -- dài để biểu đồ doanh thu sáu tháng có đủ số liệu từng tháng, tương
        -- lai đủ xa để lịch và hàng chờ thanh toán luôn có nội dung. Tương đối
        -- với hôm nay nên dữ liệu không cũ đi theo thời gian.
        --
        -- Bước nhảy 97 ngày chứ không phải cộng tuần tự. 97 nguyên tố cùng nhau
        -- với 360, nên 320 vòng lặp rơi vào 320 ngày KHÁC NHAU trải khắp cửa
        -- sổ. Cộng tuần tự thì các đơn đầu dồn hết vào quá khứ xa và các đơn
        -- cuối dồn hết vào tương lai; cách này cho mọi tháng mật độ như nhau.
        v_check_in  := CURRENT_DATE - 270 + ((v_i * 97) % 360);
        v_nights    := 1 + (v_i % 4);
        v_check_out := v_check_in + v_nights;

        -- Vài đơn ÉP phải đang diễn ra hôm nay, để trạng thái CHECKED_IN luôn
        -- có mặt. Không ép thì nó phụ thuộc vào việc bước nhảy 97 có rơi trúng
        -- ba bốn ngày quanh hôm nay hay không, VÀ đơn rơi trúng đó có đủ số
        -- đêm để kéo qua hôm nay hay không — hai điều kiện đổi theo từng ngày
        -- chạy. Đã có một lần cả tập 297 đơn không còn đơn CHECKED_IN nào, và
        -- bảng "khách đang ở" của khu quản trị trống trơn.
        IF v_i % 53 = 0 THEN
            v_check_in  := CURRENT_DATE - 1 - (v_i % 3);
            v_nights    := 4 + (v_i % 3);
            v_check_out := v_check_in + v_nights;
        END IF;


        SELECT * INTO v_room_type FROM room_types
         WHERE code = (ARRAY['STANDARD','DELUXE','FAMILY','BUNGALOW'])[1 + (v_i % 4)];

        v_qty      := CASE WHEN v_i % 9 = 0 THEN 2 ELSE 1 END;
        v_adults   := LEAST(v_room_type.capacity_adults, 2) * v_qty;
        v_children := CASE WHEN v_i % 5 = 0 AND v_room_type.capacity_children > 0
                           THEN 1 ELSE 0 END;

        -- Trạng thái suy từ ngày, rồi rắc thêm vài ngoại lệ để mọi màn hình
        -- quản trị đều có nội dung thật để hiện.
        IF v_check_out <= CURRENT_DATE THEN
            v_status := CASE
                WHEN v_i % 11 = 0 THEN 'CANCELLED'
                WHEN v_i % 13 = 0 THEN 'NO_SHOW'
                ELSE 'CHECKED_OUT' END;
        ELSIF v_check_in <= CURRENT_DATE THEN
            v_status := 'CHECKED_IN';
        ELSE
            -- Bản 40 đơn ghim hai ngoại lệ vào đúng chỉ số 32 và 34, vì ngày
            -- khi đó tăng đều theo chỉ số nên biết chắc hai số ấy rơi vào
            -- tương lai. Nay ngày rải theo bước nhảy 97 nên chỉ số không còn
            -- nói lên quá khứ hay tương lai: ghim số cố định thì rất dễ cả hai
            -- rơi vào quá khứ và biến mất, để lại hàng chờ đối soát trống.
            --
            -- Dùng phép chia lấy dư với số nguyên tố để mỗi trạng thái hiếm
            -- vẫn chắc chắn có vài đơn trong khoảng tám chục đơn tương lai.
            v_status := CASE
                WHEN v_i % 23 = 0 THEN 'AWAITING_REVIEW'
                WHEN v_i % 29 = 0 THEN 'EXPIRED'
                WHEN v_i % 3  = 0 THEN 'PENDING_PAYMENT'
                ELSE 'CONFIRMED' END;
        END IF;

        v_pay_status := CASE v_status
            WHEN 'PENDING_PAYMENT' THEN 'UNPAID'
            WHEN 'AWAITING_REVIEW' THEN 'PARTIAL'
            WHEN 'CANCELLED'       THEN 'UNPAID'
            WHEN 'EXPIRED'         THEN 'UNPAID'
            WHEN 'NO_SHOW'         THEN 'DEPOSIT_PAID'
            ELSE 'DEPOSIT_PAID' END;

        v_subtotal := v_room_type.base_price * v_nights * v_qty;
        v_discount := CASE WHEN v_i % 6 = 0
                           THEN round(LEAST(v_subtotal * 0.10, 300000), 0)
                           ELSE 0 END;
        v_total    := v_subtotal - v_discount;
        v_deposit  := round(v_total * 0.30, 0);

        -- PENDING_PAYMENT phải có hạn giữ chỗ ở TƯƠNG LAI. Đặt quá khứ thì
        -- BookingExpiryScheduler chuyển hết sang EXPIRED trong vòng 60 giây kể
        -- từ lúc container khoẻ, và "dữ liệu đủ mọi trạng thái" biến mất trước
        -- khi ai kịp mở màn hình. Đặt NULL còn tệ hơn: NULL < now() cho ra
        -- NULL, đơn treo vĩnh viễn và giam phòng.
        v_hold := CASE WHEN v_status = 'PENDING_PAYMENT'
                       THEN now() + interval '1 day'
                       WHEN v_status = 'AWAITING_REVIEW'
                       THEN now() + interval '12 hours'
                       ELSE NULL END;

        -- Hai khách đầu có tài khoản; còn lại là khách vãng lai.
        IF v_i % 7 = 1 THEN
            SELECT id, full_name, phone, email
              INTO v_user_id, v_guest_name, v_guest_phone, v_guest_email
              FROM users WHERE email = 'an.nguyen@example.com';
        ELSIF v_i % 7 = 2 THEN
            SELECT id, full_name, phone, email
              INTO v_user_id, v_guest_name, v_guest_phone, v_guest_email
              FROM users WHERE email = 'binh.tran@example.com';
        ELSE
            v_user_id     := NULL;
            v_guest_name  := v_names[1 + (v_i % array_length(v_names, 1))];
            v_guest_phone := '09' || lpad((10000000 + v_i * 37)::text, 8, '0');
            v_guest_email := 'khach' || v_i || '@example.com';
        END IF;

        -- Đơn không diễn ra thì dòng phòng là RELEASED. Hàm
        -- assert_booking_room_count miễn trừ đúng ba trạng thái này, nên số
        -- dòng ACTIVE bằng 0 là hợp lệ. CHECKED_OUT thì KHÔNG nằm trong nhóm
        -- đó: khách đã ở thật, dòng ACTIVE là bằng chứng lịch sử về số
        -- đêm-phòng đã bán và cũng là mẫu số của tỉ lệ lấp đầy.
        v_room_status := CASE WHEN v_status IN ('CANCELLED', 'EXPIRED', 'NO_SHOW')
                              THEN 'RELEASED' ELSE 'ACTIVE' END;

        -- Chọn phòng còn rảnh THẬT SỰ trong khoảng ngày này. Đơn đã huỷ vẫn
        -- giữ dòng RELEASED nên không chiếm chỗ — điều kiện status='ACTIVE'
        -- dưới đây là lý do.
        SELECT array_agg(r.id) INTO v_rooms FROM (
            SELECT r.id FROM rooms r
             WHERE r.room_type_id = v_room_type.id
               AND r.status = 'AVAILABLE'
               AND NOT EXISTS (
                   SELECT 1 FROM booking_rooms br
                    WHERE br.room_id = r.id
                      AND br.status = 'ACTIVE'
                      AND br.stay && daterange(v_check_in, v_check_out, '[)'))
               -- Tránh cả phòng đang đóng. Ràng buộc EXCLUDE không bắt trường
               -- hợp này — nó chỉ canh đơn chồng đơn — nên nếu không lọc ở đây
               -- thì seeder vẫn chạy ngon lành và để lại một đơn nằm trùng
               -- khoảng sửa chữa. Khu quản trị sẽ cảnh báo "có đơn bị ảnh
               -- hưởng" trên một dữ liệu không ai cố ý tạo ra.
               AND NOT EXISTS (
                   SELECT 1 FROM room_closures rc
                    WHERE rc.room_id = r.id
                      AND rc.blocked && daterange(v_check_in, v_check_out, '[)'))
             ORDER BY r.id
             LIMIT v_qty) r;

        -- Không đủ phòng thì bỏ qua đơn này thay vì ép vào và làm vỡ ràng buộc.
        -- Dữ liệu mẫu ít đi một đơn là chuyện nhỏ; seeder chết lúc khởi động
        -- thì cả hệ thống không lên được.
        CONTINUE WHEN v_rooms IS NULL OR array_length(v_rooms, 1) < v_qty;

        INSERT INTO bookings (
            code, access_token, user_id, guest_name, guest_email, guest_phone,
            check_in, check_out, adults, children, room_type_id,
            room_type_name_snapshot, unit_price_snapshot, room_quantity,
            subtotal_amount, discount_amount, total_amount, deposit_amount,
            status, payment_status, hold_expires_at, created_at, updated_at)
        VALUES (
            v_code, md5(v_code || 'tvh-demo-seed'), v_user_id,
            v_guest_name, v_guest_email, v_guest_phone,
            v_check_in, v_check_out, v_adults, v_children, v_room_type.id,
            v_room_type.name, v_room_type.base_price, v_qty,
            v_subtotal, v_discount, v_total, v_deposit,
            v_status, v_pay_status, v_hold,
            v_check_in - interval '7 days', now())
        RETURNING id INTO v_booking_id;

        FOREACH v_room IN ARRAY v_rooms LOOP
            INSERT INTO booking_rooms (booking_id, room_id, check_in, check_out, status)
            VALUES (v_booking_id, v_room, v_check_in, v_check_out, v_room_status);
        END LOOP;

        INSERT INTO booking_status_history (booking_id, from_status, to_status, actor, note, created_at)
        VALUES (v_booking_id, NULL, 'PENDING_PAYMENT', 'GUEST', 'Đơn mẫu', v_check_in - interval '7 days');

        IF v_status <> 'PENDING_PAYMENT' THEN
            INSERT INTO booking_status_history (booking_id, from_status, to_status, actor, note, created_at)
            VALUES (v_booking_id, 'PENDING_PAYMENT', v_status, 'SYSTEM', 'Đơn mẫu',
                    v_check_in - interval '6 days');
        END IF;

        -- Thanh toán: chỉ những đơn thật sự đã trả tiền mới có dòng payments.
        IF v_pay_status IN ('DEPOSIT_PAID', 'PARTIAL') THEN
            INSERT INTO payments (
                booking_id, attempt_no, provider, amount_expected, amount_received,
                transfer_content, status, reconcile_status, provider_txn_id,
                paid_at, created_at, updated_at)
            VALUES (
                v_booking_id, 1, 'SEPAY', v_deposit,
                CASE WHEN v_pay_status = 'PARTIAL' THEN round(v_deposit * 0.5, 0) ELSE v_deposit END,
                v_code || '01',
                CASE WHEN v_pay_status = 'PARTIAL' THEN 'PARTIAL' ELSE 'SUCCEEDED' END,
                CASE WHEN v_pay_status = 'PARTIAL' THEN 'NEEDS_REVIEW' ELSE 'NONE' END,
                'DEMO' || lpad(v_i::text, 6, '0'),
                v_check_in - interval '6 days',
                v_check_in - interval '7 days',
                now());
        END IF;
    END LOOP;
END
$seed$;

-- ─── Hai khoản cần đối soát ─────────────────────────────────────────────────
-- Màn hình /admin/payments không có gì để hiện nếu mọi khoản đều khớp. Một
-- khoản THIẾU tiền và một khoản THỪA tiền là hai nhánh khác nhau của luồng đối
-- soát: thiếu thì chờ khách bù, thừa thì phải hoàn lại. Cập nhật cả
-- bookings.payment_status cho khớp — hai bảng lệch nhau là thứ người chấm sẽ
-- nhìn ra ngay.
DO $reconcile$
DECLARE
    v_over  varchar(20);
    v_under varchar(20);
BEGIN
    -- Chọn theo MÃ ĐƠN cố định, không phải "hai dòng NONE đầu tiên". Cách sau
    -- trông gọn hơn nhưng không idempotent: chạy lần hai thì hai dòng cũ không
    -- còn NONE nữa nên nó chọn hai dòng KHÁC và đánh dấu tiếp — sau vài lần
    -- khởi động lại, hàng chờ đối soát đầy những khoản không ai tạo ra.
    -- Ghim vào mã đơn thì lần chạy sau không tìm thấy gì để sửa.
    SELECT code INTO v_over FROM bookings
     WHERE code LIKE 'TVHDEMO%' AND status = 'CHECKED_OUT'
     ORDER BY code LIMIT 1;

    SELECT code INTO v_under FROM bookings
     WHERE code LIKE 'TVHDEMO%' AND status = 'CHECKED_OUT'
     ORDER BY code OFFSET 1 LIMIT 1;

    -- Thừa tiền → phải hoàn lại.
    UPDATE payments p
       SET amount_received  = round(p.amount_expected * 1.20, 0),
           status           = 'OVERPAID',
           reconcile_status = 'REFUND_REQUIRED'
      FROM bookings b
     WHERE b.id = p.booking_id AND b.code = v_over AND p.reconcile_status = 'NONE';

    UPDATE bookings SET payment_status = 'OVERPAID'
     WHERE code = v_over AND payment_status <> 'OVERPAID';

    -- Thiếu tiền → chờ khách bù, nhân viên xem lại.
    UPDATE payments p
       SET amount_received  = round(p.amount_expected * 0.60, 0),
           status           = 'PARTIAL',
           reconcile_status = 'NEEDS_REVIEW'
      FROM bookings b
     WHERE b.id = p.booking_id AND b.code = v_under AND p.reconcile_status = 'NONE';

    UPDATE bookings SET payment_status = 'PARTIAL'
     WHERE code = v_under AND payment_status <> 'PARTIAL';
END
$reconcile$;

-- ─── Đánh giá: 18 đã duyệt, 4 chờ duyệt, 2 đã từ chối ───────────────────────
-- Chỉ gắn vào đơn CHECKED_OUT: đánh giá của một chuyến chưa diễn ra là dữ liệu
-- vô nghĩa, và ràng buộc UNIQUE (booking_id) lo phần "mỗi đơn một đánh giá".
--
-- Hai mươi bốn bài viết TAY, không nhân bản một bài rồi đổi số. Trang đánh giá
-- công khai là chỗ khách đọc kỹ nhất trước khi đặt; hai mươi bài giống hệt nhau
-- nói rõ với người đọc rằng không có khách nào thật. Phân bố điểm cũng cố ý
-- không toàn 5 sao: một trang chỉ có 5 sao là trang không ai tin.
--
-- Đủ ba trạng thái: đã duyệt cho trang công khai, chờ duyệt cho hàng đợi kiểm
-- duyệt, và đã từ chối để chứng minh nhánh từ chối có thật chứ không phải nút
-- bấm vào không làm gì.
INSERT INTO reviews (booking_id, user_id, guest_name_snapshot, rating, title, content, status, admin_reply, replied_at, created_at)
SELECT b.id, b.user_id, b.guest_name, v.rating, v.title, v.content, v.status,
       v.admin_reply,
       CASE WHEN v.admin_reply IS NULL THEN NULL ELSE b.check_out + interval '2 days' END,
       b.check_out + interval '1 day'
  FROM (
        SELECT code, row_number() OVER (ORDER BY code) AS rn
          FROM bookings
         WHERE status = 'CHECKED_OUT' AND code LIKE 'TVHDEMO%'
       ) picked
  JOIN bookings b ON b.code = picked.code
  JOIN (VALUES
        (1, 5, 'Yên tĩnh đúng như mong đợi',
            'Phòng sạch, chủ nhà thân thiện. Sáng dậy nghe tiếng chim, không nghe tiếng xe. Bữa sáng ngon hơn nhiều quán ngoài.',
            'APPROVED', 'Cảm ơn anh chị đã ghé. Hẹn gặp lại mùa sau!'),
        (2, 4, 'Bungalow rất đáng tiền',
            'Hiên trước nhìn ra sông, buổi chiều ngồi đó uống trà rất thích. Trừ một sao vì wifi ở bungalow hơi yếu.',
            'APPROVED', 'Cảm ơn góp ý. Chúng tôi đã lắp thêm bộ phát ở cuối vườn.'),
        (3, 5, 'Phù hợp gia đình có trẻ nhỏ',
            'Phòng gia đình rộng, giường thấp nên bé không sợ ngã. Chủ nhà cho mượn ghế ăn cho bé mà không tính thêm tiền.',
            'APPROVED', NULL),
        (4, 4, 'Đi lại hơi xa trung tâm',
            'Homestay đẹp và yên, nhưng nên thuê xe máy hoặc xe đạp. Đi bộ ra quán ăn thì hơi xa.',
            'APPROVED', 'Dạ đúng ạ, homestay có cho thuê xe đạp miễn phí cho khách ở từ 2 đêm.'),
        (5, 5, 'Bữa sáng nhớ mãi',
            'Bún nước lèo chủ nhà nấu ngon hơn quán. Đây là lý do tôi sẽ quay lại.',
            'APPROVED', NULL),
        (6, 3, 'Phòng Standard hơi nhỏ',
            'Sạch sẽ, nhưng hai người ở thì chật. Lần sau tôi sẽ đặt Deluxe.',
            'APPROVED', 'Cảm ơn anh đã phản hồi thẳng thắn. Phòng Standard thiết kế cho một người hoặc cặp đôi ở ngắn ngày.'),
        (7, 5, 'Sẽ quay lại',
            'Không có gì để chê. Chủ nhà còn chở ra bến xe lúc về.',
            'APPROVED', NULL),
        (8, 2, 'Nước nóng yếu vào buổi tối',
            'Mọi thứ ổn trừ chuyện tắm nước nóng lúc 9 giờ tối thì gần như không có nước nóng.',
            'APPROVED', 'Bình nóng lạnh đã được thay mới tháng trước. Mong anh cho chúng tôi một cơ hội nữa.'),
        (9, 5, 'Đúng chỗ để nghỉ sau một tuần chạy deadline',
            'Ba ngày không mở laptop. Võng ngoài hiên và tiếng nước chảy làm được việc mà thuốc ngủ không làm được.',
            'APPROVED', NULL),
        (10, 4, 'Vườn đẹp, muỗi cũng nhiều',
            'Chiều ngồi vườn rất thích nhưng nên xịt chống muỗi trước. Chủ nhà có để sẵn chai xịt ở quầy, nên nhớ lấy.',
            'APPROVED', 'Cảm ơn chị. Chúng tôi đang trồng thêm sả quanh bờ mương cho đỡ muỗi.'),
        (11, 5, 'Chủ nhà chỉ đường ăn uống rất chuẩn',
            'Hỏi ăn gì ngon, chủ nhà vẽ hẳn bản đồ ra giấy. Quán bánh canh Bến Có đúng như lời giới thiệu.',
            'APPROVED', NULL),
        (12, 4, 'Sạch sẽ, nhân viên dễ thương',
            'Phòng được dọn mỗi ngày dù mình ở ngắn. Khăn thay mới, không có mùi ẩm như vài chỗ khác trong vùng.',
            'APPROVED', NULL),
        (13, 5, 'Đạp xe vòng cù lao là điểm cộng lớn',
            'Mượn xe đạp miễn phí, đi một vòng hết buổi sáng. Đường vắng, hai bên toàn vườn dừa.',
            'APPROVED', 'Mùa này đường đê khô ráo, đạp rất dễ chịu. Cảm ơn anh đã chia sẻ!'),
        (14, 3, 'Tiếng ồn từ phòng bên',
            'Vách giữa hai phòng Standard hơi mỏng, nghe được tiếng nói chuyện. Những thứ khác đều ổn.',
            'APPROVED', 'Cảm ơn anh. Chúng tôi đã dán thêm lớp cách âm cho dãy 101-104.'),
        (15, 5, 'Trả phòng muộn mà không bị tính thêm',
            'Xe về lúc 5 giờ chiều, chủ nhà cho gửi hành lý và tắm lại trước khi đi. Rất được.',
            'APPROVED', NULL),
        (16, 4, 'Deluxe đáng thêm tiền so với Standard',
            'Ban công nhìn ra vườn xoài, sáng ngồi uống cà phê ở đó rất đáng. Chênh lệch giá hoàn toàn hợp lý.',
            'APPROVED', NULL),
        (17, 5, 'Lần thứ ba quay lại',
            'Năm nào cũng ghé một lần. Mỗi lần thấy thêm một thứ mới — năm nay là cái chòi câu cá ngoài mương.',
            'APPROVED', 'Cảm ơn chị đã đồng hành từ năm đầu. Chòi câu mới dựng tháng rồi ạ!'),
        (18, 2, 'Đặt phòng xong không thấy thư xác nhận',
            'Thư rơi vào hộp thư rác nên tưởng đặt hỏng, phải gọi điện hỏi. Phòng thì không có gì để chê.',
            'APPROVED', 'Xin lỗi chị vì phiền toái. Chúng tôi đã ghi chú nhắc khách kiểm tra hộp thư rác ngay trên màn hình xác nhận.'),
        (19, 5, 'Bungalow buổi tối rất tình',
            'Đèn vàng, tiếng dế, nước vỗ nhẹ vào bờ. Đi hai người thì nên chọn bungalow chứ đừng tiếc tiền.',
            'PENDING', NULL),
        (20, 4, 'Nên có thêm chỗ phơi đồ',
            'Ở bốn ngày nên có giặt đồ, mà không biết phơi đâu cho tiện. Ngoài ra mọi thứ đều tốt.',
            'PENDING', NULL),
        (21, 5, 'Cảm ơn cô chủ đã nấu cháo lúc con tôi sốt',
            'Nửa đêm bé sốt, cô chủ dậy nấu cháo và chỉ đường tới phòng khám. Chuyện này tôi nhớ lâu.',
            'PENDING', NULL),
        (22, 1, 'Không đúng như hình',
            'Đặt phòng gia đình nhưng nhận phòng nhỏ hơn hình nhiều.',
            'PENDING', NULL),
        (23, 1, 'abcxyz test test',
            'aaaaaaaaaaaa bbbbbbbbbbbb cccccccccccc',
            'REJECTED', NULL),
        (24, 5, 'Liên hệ 09xxxxxxxx để được giảm giá tour giá rẻ nhất',
            'Nhận đặt tour miền Tây giá rẻ, inbox ngay. Homestay cũng ổn.',
            'REJECTED', NULL)
       ) AS v(rn, rating, title, content, status, admin_reply) ON v.rn = picked.rn
 WHERE NOT EXISTS (SELECT 1 FROM reviews r WHERE r.booking_id = b.id);

-- ─── Ghi chú nội bộ trên mười bốn đơn ───────────────────────────────────────
-- Khối "Ghi chú nội bộ" ở màn hình chi tiết đơn luôn hiện "Chưa có ghi chú nào"
-- nếu không seed, nên người xem không biết chức năng này tồn tại. Ghi chú viết
-- theo giọng người trực thật, không phải câu mẫu.
INSERT INTO booking_notes (booking_id, author_id, content, created_at)
SELECT b.id,
       (SELECT id FROM users WHERE email = 'admin@tvh.local'),
       v.content,
       b.created_at + interval '1 day'
  FROM bookings b
  JOIN (VALUES
        (1, 'Khách gọi báo tới trễ, khoảng 21h30. Đã dặn bảo vệ để cửa trước.'),
        (2, 'Xin thêm một nệm phụ cho bé 5 tuổi. Đã chuẩn bị, không tính thêm tiền.'),
        (3, 'Khách hỏi thuê xe đạp hai chiếc trong hai ngày. Đã báo giá 100k.'),
        (4, 'Đi cùng nhóm bạn đặt phòng 202 — xếp hai phòng cạnh nhau.'),
        (5, 'Khách dị ứng hải sản, đã báo bếp đổi món cho bữa sáng.'),
        (6, 'Đã gọi xác nhận trước một ngày, khách báo vẫn đi đúng lịch.'),
        (7, 'Khách đi xe khách, xin đón ở bến xe Trà Vinh lúc 14h. Đã nhận.'),
        (8, 'Kỷ niệm ngày cưới — chuẩn bị bình hoa nhỏ và thiệp đặt trên bàn.'),
        (9, 'Khách hỏi có nhận thú cưng không. Đã trả lời là chưa nhận được.'),
        (10, 'Chuyển khoản thiếu 50k do gõ nhầm, khách đã bù ngay trong ngày.'),
        (11, 'Xin trả phòng trễ tới 15h vì xe chiều. Đồng ý, không thu thêm.'),
        (12, 'Khách lớn tuổi, xin phòng tầng trệt. Đã đổi từ 203 xuống 102.'),
        (13, 'Nhóm sáu người đi chụp ảnh, hỏi mượn bếp nấu ăn tối. Đã đồng ý.'),
        (14, 'Khách bỏ quên sạc điện thoại ở phòng 201, đã liên hệ gửi lại.')
       ) AS v(rn, content)
    ON v.rn = (
        SELECT rn FROM (
            SELECT id, row_number() OVER (ORDER BY check_in DESC) AS rn
              FROM bookings
             WHERE code LIKE 'TVHDEMO%' AND status IN ('CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT')
        ) t WHERE t.id = b.id)
 WHERE NOT EXISTS (SELECT 1 FROM booking_notes n WHERE n.booking_id = b.id);

-- ─── Hộp thư đi: thư đã gửi và một thư thất bại ─────────────────────────────
-- Khối "Hộp thư đi" ở chi tiết đơn cũng trống nếu không seed. Quan trọng hơn:
-- một dòng FAILED là thứ chứng minh hàng đợi thư có nhánh hỏng và có người xử
-- lý, chứ không phải "gửi xong là xong". Chỉ seed cho đơn đã xác nhận — đơn
-- chưa trả tiền thì chưa có thư xác nhận nào để gửi.
--
-- payload dựng từ chính dữ liệu đơn, không phải chuỗi cố định: thư trong hộp
-- phải khớp với đơn mà nó nói tới.
INSERT INTO outbound_emails (booking_id, template, to_email, payload, status,
                             attempts, last_error, sent_at, created_at)
SELECT b.id, 'booking-confirmed', b.guest_email,
       jsonb_build_object(
           'code', b.code,
           'guestName', b.guest_name,
           'roomTypeName', b.room_type_name_snapshot,
           'checkIn', to_char(b.check_in, 'DD/MM/YYYY'),
           'checkOut', to_char(b.check_out, 'DD/MM/YYYY'),
           'nights', (b.check_out - b.check_in),
           'roomQuantity', b.room_quantity,
           'adults', b.adults,
           'children', b.children,
           'totalAmount', to_char(b.total_amount, 'FM999G999G999') || ' đ',
           'depositAmount', to_char(b.deposit_amount, 'FM999G999G999') || ' đ',
           'remainingAmount', to_char(greatest(b.total_amount - b.deposit_amount, 0), 'FM999G999G999') || ' đ'),
       -- Một đơn duy nhất mang trạng thái FAILED, chọn theo mã đơn cho ổn định.
       CASE WHEN b.code = 'TVHFULL01' THEN 'FAILED' ELSE 'SENT' END,
       CASE WHEN b.code = 'TVHFULL01' THEN 5 ELSE 1 END,
       CASE WHEN b.code = 'TVHFULL01'
            THEN 'Máy chủ thư trả về 550: hộp thư người nhận không tồn tại'
            ELSE NULL END,
       CASE WHEN b.code = 'TVHFULL01' THEN NULL
            ELSE b.updated_at + interval '2 minutes' END,
       b.updated_at
  FROM bookings b
 WHERE b.status IN ('CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT')
   AND b.payment_status IN ('DEPOSIT_PAID', 'PAID')
   AND NOT EXISTS (SELECT 1 FROM outbound_emails e WHERE e.booking_id = b.id);
