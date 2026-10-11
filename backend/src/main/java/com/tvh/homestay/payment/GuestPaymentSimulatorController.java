package com.tvh.homestay.payment;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tvh.homestay.booking.BookingService;
import com.tvh.homestay.booking.entity.Booking;
import com.tvh.homestay.payment.entity.Payment;
import com.tvh.homestay.payment.entity.WebhookProcessingResult;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/**
 * Nút "tôi đã chuyển khoản" của bản trình diễn, dành cho CHÍNH khách đang đặt.
 *
 * <p><b>Vì sao cần cái này khi đã có {@link PaymentSimulatorController}.</b>
 * Bản kia nằm dưới {@code /api/admin/dev/**} nên đòi vai trò ADMIN. Khách đặt
 * phòng không có vai trò đó, nên với bản kia thì luồng khách KHÔNG chạy hết
 * được: đặt xong, thấy mã QR, rồi ngồi chờ 15 phút cho đơn tự huỷ. Muốn trình
 * diễn trọn vòng thì phải mở một cửa cho chính người đang đứng ở màn thanh
 * toán.
 *
 * <p><b>Ba rào chắn, giữ nguyên như bản quản trị, đổi cái thứ ba.</b>
 *
 * <ol>
 *   <li>{@code @Profile("!prod")} — không bao giờ nạp ở bản triển khai thật.
 *   <li>{@link ConditionalOnProperty} — cờ {@code payments.simulator.enabled}
 *       MẶC ĐỊNH TẮT. Không có cờ thì bean này không tồn tại, nên đường dẫn
 *       trả 404 chứ không phải 403: người dò đường không biết có gì ở đây.
 *   <li>Thay vì đòi vai trò ADMIN, đòi {@code accessToken} của ĐÚNG đơn đó.
 *       Đây là cùng một bằng chứng sở hữu mà màn hình QR đã dùng để xem trạng
 *       thái, nên không hạ thấp mức bảo vệ nào: ai xác nhận được đơn thì cũng
 *       đã xem được đơn rồi.
 * </ol>
 *
 * <p><b>Không gọi tắt vào tầng trong.</b> Payload dựng y hệt SePay rồi đi qua
 * {@link SepayWebhookService#handle(String)} — đúng đường mà tiền thật sẽ đi.
 * Nếu đường mô phỏng khác đường thật thì buổi bảo vệ chứng minh được một thứ
 * mà bản chạy thật không có, và đó là kiểu demo tệ nhất.
 */
@RestController
@Profile("!prod")
@ConditionalOnProperty(prefix = "payments.simulator", name = "enabled", havingValue = "true")
public class GuestPaymentSimulatorController {

    private static final DateTimeFormatter SEPAY_TIME =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private final BookingService bookings;
    private final SepayWebhookService webhooks;
    private final PaymentService payments;
    private final VietQrGenerator qr;
    private final ObjectMapper objectMapper;
    private final Clock clock;

    public GuestPaymentSimulatorController(
            BookingService bookings,
            SepayWebhookService webhooks,
            PaymentService payments,
            VietQrGenerator qr,
            ObjectMapper objectMapper,
            Clock clock) {
        this.bookings = bookings;
        this.webhooks = webhooks;
        this.payments = payments;
        this.qr = qr;
        this.objectMapper = objectMapper;
        this.clock = clock;
    }

    /**
     * Mô phỏng khách chuyển đúng số tiền cọc của đơn mình đang giữ.
     *
     * <p>{@code token} bắt buộc, và cố tình KHÔNG nhận số điện thoại thay thế
     * như {@code lookup}: tra cứu là việc đọc, còn đây là việc làm đổi trạng
     * thái đơn. Số điện thoại in trên nhiều giấy tờ hơn là mã truy cập.
     */
    @PostMapping("/api/bookings/{code}/simulate-transfer")
    public ResponseEntity<Map<String, Object>> simulate(
            @PathVariable String code,
            @RequestParam(name = "token") String token,
            @RequestParam(name = "amount", required = false) BigDecimal amount) {

        Booking booking = bookings.requireByCodeAndToken(code, token);

        // Lần thanh toán MỚI NHẤT, không phải lần đầu: khách bấm "đặt lại" sau
        // khi hết hạn giữ chỗ sẽ sinh thêm một attempt, và nội dung chuyển
        // khoản của attempt cũ không còn khớp đơn nữa.
        Payment payment = payments.latestFor(booking.getId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Đơn " + booking.getCode() + " chưa có lần thanh toán nào để mô phỏng"));

        BigDecimal transferred = amount != null ? amount : payment.getAmountExpected();

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("id", maGiaoDich(payment));
        payload.put("gateway", "SimulatorBank");
        payload.put("transactionDate", LocalDateTime.now(clock).format(SEPAY_TIME));
        payload.put("accountNumber", qr.getAccountNumber());
        payload.put("code", null);
        payload.put("content", payment.getTransferContent());
        payload.put("transferType", "in");
        payload.put("description", "Giao dich mo phong " + payment.getTransferContent());
        payload.put("transferAmount", transferred);
        payload.put("accumulated", 0);
        payload.put("referenceCode", "SIM" + payment.getId());

        WebhookProcessingResult result = webhooks.handle(writeJson(payload));
        return ResponseEntity.ok(Map.of(
                "code", booking.getCode(),
                "transferAmount", transferred,
                "result", result.name()));
    }

    /**
     * Mã giao dịch của lần chuyển khoản mô phỏng, suy ra từ chính lần thanh
     * toán chứ KHÔNG sinh ngẫu nhiên.
     *
     * <p><b>Vì sao không ngẫu nhiên.</b> Bản đầu dùng số ngẫu nhiên, và bấm nút
     * hai lần sinh ra hai giao dịch khác mã: hệ thống ghi nhận 1.800.000đ cho
     * một đơn cọc 900.000đ. Số tiền đó không có thật. Lớp chống trùng của
     * webhook so theo {@code (provider, external_id)}, nên chỉ cần mã ổn định
     * là lần bấm thứ hai bị nhận ra là bản sao và bỏ qua — đúng cách SePay
     * phát lại một giao dịch.
     *
     * <p><b>Vì sao số ÂM.</b> Mã giao dịch của SePay luôn dương. Lấy số âm thì
     * một giao dịch mô phỏng không bao giờ đụng mã với một giao dịch thật, kể
     * cả khi hai thứ cùng nằm trong một cơ sở dữ liệu. Nhìn vào bảng
     * {@code payment_webhook_events} cũng phân biệt được ngay bằng mắt.
     *
     * <p>Khác với {@link PaymentSimulatorController} — bản quản trị cố ý dùng
     * mã ngẫu nhiên vì nó là bàn thử nghiệm: người quản trị cần bắn được nhiều
     * giao dịch khác nhau vào một đơn (trả thiếu, trả thừa, trả hai lần).
     */
    private static long maGiaoDich(Payment payment) {
        return -payment.getId();
    }

    private String writeJson(Map<String, Object> payload) {
        try {
            return objectMapper.writeValueAsString(payload);
        } catch (Exception e) {
            throw new IllegalStateException("Không dựng được payload mô phỏng", e);
        }
    }
}
