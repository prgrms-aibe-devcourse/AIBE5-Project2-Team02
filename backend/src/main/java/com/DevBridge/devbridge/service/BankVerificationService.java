package com.DevBridge.devbridge.service;

import com.DevBridge.devbridge.entity.User;
import com.DevBridge.devbridge.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
@RequiredArgsConstructor
public class BankVerificationService {

    private final UserRepository userRepository;
    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String fromAddress;

    // userId → 인증 코드 (3자리), 목업용 인메모리 저장
    private final Map<Long, String> codeStore = new ConcurrentHashMap<>();

    /**
     * 인증 코드 발급. 실제 1원 송금 대신 사용자 가입 이메일로 3자리 코드를 발송한다.
     * 메일 발송 실패해도 코드는 codeStore에 저장되어 시연(개발 모드)에선 이어서 verify 가능.
     */
    public String sendCode(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
        String code = String.format("%03d", (int) (Math.random() * 1000));
        codeStore.put(userId, code);

        // 수신지 결정: contactEmail > email
        String to = (user.getContactEmail() != null && !user.getContactEmail().isBlank())
                ? user.getContactEmail() : user.getEmail();

        if (to != null && !to.isBlank() && fromAddress != null && !fromAddress.isBlank()) {
            try {
                SimpleMailMessage msg = new SimpleMailMessage();
                msg.setFrom(fromAddress);
                msg.setTo(to);
                msg.setSubject("[DevBridge] 계좌 인증 입금자명 코드");
                msg.setText(
                    "안녕하세요, " + (user.getUsername() != null ? user.getUsername() : "DevBridge 사용자") + "님.\n\n" +
                    "계좌 인증을 위해 입금자명에 표시될 3자리 코드를 알려드립니다.\n\n" +
                    "    코드: " + code + "\n\n" +
                    "DevBridge에서 계좌 등록 화면으로 돌아가 위 코드를 입력해 주세요.\n" +
                    "본 메일은 시연/목업 환경에서 발송된 메일입니다."
                );
                mailSender.send(msg);
                log.info("[BankVerification] 코드 메일 발송 성공: to={}", to);
            } catch (Exception e) {
                log.warn("[BankVerification] 코드 메일 발송 실패 ({}): {}", to, e.getMessage());
            }
        } else {
            log.warn("[BankVerification] 메일 발송 스킵 — to={}, from={}", to, fromAddress);
        }
        return code;
    }

    /**
     * 인증 코드 확인 + 계좌 정보 DB 저장
     */
    @Transactional
    public void verifyAndSave(Long userId, String code,
                              String bankName, String accountNumber, String accountHolder) {
        String stored = codeStore.get(userId);
        if (stored == null) throw new RuntimeException("인증번호를 먼저 요청해 주세요.");
        if (!stored.equals(code)) throw new RuntimeException("인증번호가 일치하지 않습니다.");

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
        user.setBankName(bankName);
        user.setBankAccountNumber(accountNumber);
        user.setBankAccountHolderName(accountHolder);
        user.setBankVerified(true);
        userRepository.save(user);
        codeStore.remove(userId);
    }

    /**
     * 저장된 계좌 정보 조회
     */
    public User getAccount(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
    }
}
