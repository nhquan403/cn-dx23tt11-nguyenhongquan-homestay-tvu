package com.tvh.homestay.payment;

import static org.assertj.core.api.Assertions.assertThat;

import com.tvh.homestay.booking.BookingService;
import com.tvh.homestay.booking.BookingTestFixtures;
import com.tvh.homestay.booking.dto.BookingDtos.BookingResponse;
import com.tvh.homestay.schema.AbstractPostgresIT;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;

/**
 * Nút "tôi đã chuyển khoản" của khách: đi được trọn vòng, và không đi quá.
 *
 * <p>Đồ án chưa đăng ký tài khoản SePay thật, nên không có tiền thật nào chạy
 * qua được. Nút này là cách để luồng đặt phòng vẫn chứng minh được từ đầu tới
 * cuối. Vì nó đổi trạng thái đơn bằng một cú POST không cần đăng nhập, phần
 * đáng kiểm nhất KHÔNG phải "bấm thì đơn xác nhận" mà là ba điều kia: ai bấm
 * được, bấm nhiều lần thì sao, và bản triển khai thật có mở cửa này không.
 *
 * <p>Cờ {@code payments.simulator.enabled} được bật bằng {@code properties}
 * của chính lớp này. Mặc định trong mã nguồn là TẮT ở mọi profile — nếu không
 * bật ở đây thì bean không tồn tại và mọi test dưới đây sẽ nhận 404.
 */
@SpringBootTest(
        webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
        properties = {
            "payments.simulator.enabled=true",
            "SEPAY_ACCOUNT_NUMBER=0123456789",
            "SEPAY_BANK_CODE=MBBank",
            // Tắt bộ quét nền: test tự quyết định thời điểm, không chờ và đoán.
            "booking.expiry-scan-ms=3600000",
            "mail.dispatch-ms=3600000"
        })
class GuestPaymentSimulatorIT extends AbstractPostgresIT {

    private static final LocalDate CHECK_IN = LocalDate.of(2027, 3, 10);
    private static final LocalDate CHECK_OUT = LocalDate.of(2027, 3, 12);

    @Autowired
    private TestRestTemplate rest;

    @Autowired
    private BookingService bookings;

    @Autowired
    private JdbcTemplate jdbc;

    @BeforeEach
    void cleanSlate() {
        BookingTestFixtures.reset(jdbc, 2);
    }

    @Test
    @DisplayName("Đúng mã truy cập → đơn CONFIRMED, có thư xác nhận, sự kiện webhook MATCHED")
    void correctTokenConfirmsBooking() {
        BookingResponse booking = createBooking(1);

        ResponseEntity<Map> response = simulate(booking.code(), booking.accessToken());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).containsEntry("result", "MATCHED");

        assertThat(statusOf(booking.code())).isEqualTo("CONFIRMED");
        assertThat(paymentStatusOf(booking.code())).isEqualTo("DEPOSIT_PAID");
        assertThat(amountReceived(booking.code())).isEqualByComparingTo(booking.depositAmount());
        assertThat(emailCount(booking.code(), "booking-confirmed")).isEqualTo(1);
    }

    /**
     * Bản đầu dùng mã giao dịch ngẫu nhiên, và test này là test đã bắt được
     * lỗi: bấm ba lần ghi nhận ba lần tiền, đơn cọc 900.000đ thành
     * 2.700.000đ đã nhận. Số tiền đó không có thật.
     */
    @Test
    @DisplayName("Bấm ba lần → chỉ MỘT lần tiền được ghi nhận, hai lần sau là DUPLICATE")
    void pressingThreeTimesNeverInventsMoney() {
        BookingResponse booking = createBooking(2);

        assertThat(simulate(booking.code(), booking.accessToken()).getBody())
                .containsEntry("result", "MATCHED");
        assertThat(simulate(booking.code(), booking.accessToken()).getBody())
                .containsEntry("result", "DUPLICATE");
        assertThat(simulate(booking.code(), booking.accessToken()).getBody())
                .containsEntry("result", "DUPLICATE");

        assertThat(amountReceived(booking.code()))
                .as("cộng dồn mỗi lần bấm là ghi nhận tiền không có thật")
                .isEqualByComparingTo(booking.depositAmount());
        assertThat(webhookEventCount())
                .as("ba lần bấm chỉ được sinh một dòng sự kiện")
                .isEqualTo(1);
        assertThat(emailCount(booking.code(), "booking-confirmed"))
                .as("mỗi lần bấm thêm một thư là khách nhận ba thư giống hệt nhau")
                .isEqualTo(1);
    }

    @Test
    @DisplayName("Mã giao dịch mô phỏng là số ÂM — không bao giờ đụng mã của một giao dịch thật")
    void simulatedTransactionIdIsNegative() {
        BookingResponse booking = createBooking(3);

        simulate(booking.code(), booking.accessToken());

        String externalId = jdbc.queryForObject(
                "SELECT external_id FROM payment_webhook_events ORDER BY id DESC LIMIT 1",
                String.class);
        assertThat(Long.parseLong(externalId))
                .as("mã giao dịch của SePay luôn dương")
                .isNegative();
    }

    @Test
    @DisplayName("Sai mã truy cập → 401, đơn không nhúc nhích")
    void wrongTokenIsRejected() {
        BookingResponse booking = createBooking(4);

        ResponseEntity<Map> response = simulate(booking.code(), "khong-phai-ma-that");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(statusOf(booking.code())).isEqualTo("PENDING_PAYMENT");
        assertThat(amountReceived(booking.code())).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(webhookEventCount())
                .as("một lần gọi bị chặn ở cửa không được để lại dấu vết trong sổ giao dịch")
                .isZero();
    }

    @Test
    @DisplayName("Mã truy cập của đơn KHÁC → 401, không xác nhận hộ đơn của người ta")
    void tokenOfAnotherBookingIsRejected() {
        BookingResponse mine = createBooking(5);
        BookingResponse theirs = createBooking(6);

        ResponseEntity<Map> response = simulate(theirs.code(), mine.accessToken());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(statusOf(theirs.code())).isEqualTo("PENDING_PAYMENT");
    }

    @Test
    @DisplayName("Mã đơn không có thật → 404")
    void unknownBookingCodeIsNotFound() {
        BookingResponse booking = createBooking(7);

        assertThat(simulate("TVHKHONGCO", booking.accessToken()).getStatusCode())
                .isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    @DisplayName("Trạng thái thanh toán báo cho giao diện biết nút đang bật")
    void paymentStatusAdvertisesTheSimulator() {
        BookingResponse booking = createBooking(8);

        ResponseEntity<Map> status = rest.getForEntity(
                "/api/bookings/{code}/payment-status?token={token}",
                Map.class, booking.code(), booking.accessToken());

        assertThat(status.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(status.getBody())
                .as("giao diện đọc cờ này để quyết định có vẽ nút hay không, "
                        + "thay vì gọi thử rồi bắt 404")
                .containsEntry("simulatorEnabled", true);
    }

    // ── Tiện ích ────────────────────────────────────────────────────────────

    @SuppressWarnings("rawtypes")
    private ResponseEntity<Map> simulate(String code, String token) {
        return rest.postForEntity(
                "/api/bookings/{code}/simulate-transfer?token={token}",
                null, Map.class, code, token);
    }

    private BookingResponse createBooking(int seq) {
        return bookings.create(
                BookingTestFixtures.request(CHECK_IN, CHECK_OUT, 1, seq), null, "127.0.0.1", "junit");
    }

    private String statusOf(String code) {
        return jdbc.queryForObject("SELECT status FROM bookings WHERE code = ?", String.class, code);
    }

    private String paymentStatusOf(String code) {
        return jdbc.queryForObject(
                "SELECT payment_status FROM bookings WHERE code = ?", String.class, code);
    }

    private BigDecimal amountReceived(String code) {
        return jdbc.queryForObject("""
                SELECT coalesce(sum(p.amount_received), 0)
                  FROM payments p JOIN bookings b ON b.id = p.booking_id
                 WHERE b.code = ?
                """, BigDecimal.class, code);
    }

    private int webhookEventCount() {
        return jdbc.queryForObject("SELECT count(*) FROM payment_webhook_events", Integer.class);
    }

    private int emailCount(String code, String template) {
        return jdbc.queryForObject("""
                SELECT count(*) FROM outbound_emails e JOIN bookings b ON b.id = e.booking_id
                 WHERE b.code = ? AND e.template = ?
                """, Integer.class, code, template);
    }
}
