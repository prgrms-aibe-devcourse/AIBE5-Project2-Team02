package com.DevBridge.devbridge.service;

import com.DevBridge.devbridge.entity.User;
import com.DevBridge.devbridge.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class BankVerificationService {

    private final UserRepository userRepository;

    // userId → 인증 코드 (3자리), 목업용 인메모리 저장
    private final Map<Long, String> codeStore = new ConcurrentHashMap<>();

    /**
     * 인증 코드 발급 (목업: 실제 1원 송금 대신 코드 반환)
     */
    public String sendCode(Long userId) {
        userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
        String code = String.format("%03d", (int) (Math.random() * 1000));
        codeStore.put(userId, code);
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
