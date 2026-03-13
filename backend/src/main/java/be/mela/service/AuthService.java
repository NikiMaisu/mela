package be.mela.service;

import be.mela.dto.AuthDto;
import be.mela.model.User;
import be.mela.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public String generateRawCode() {
        SecureRandom random = new SecureRandom();
        StringBuilder sb = new StringBuilder(20);
        for (int i = 0; i < 20; i++) {
            sb.append(random.nextInt(10));
        }
        return sb.toString();
    }

    public User createUserWithCode(String rawCode) {
        User user = new User();
        user.setCodeHash(sha256(rawCode));
        return userRepository.save(user);
    }

    public User loginWithCode(String rawCode) {
        String hash = sha256(rawCode.replaceAll("[^0-9]", ""));
        return userRepository.findByCodeHash(hash)
                .orElseThrow(() -> new RuntimeException("invalid code"));
    }

    public User loginWithCredentials(String email, String password) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("invalid credentials"));
        if (user.getPasswordHash() == null || !passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new RuntimeException("invalid credentials");
        }
        return user;
    }

    public User upgrade(Long userId, String username, String email, String password) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("user not found"));
        if (username != null && !username.isBlank()) user.setUsername(username);
        if (email != null && !email.isBlank()) user.setEmail(email);
        if (password != null && !password.isBlank()) user.setPasswordHash(passwordEncoder.encode(password));
        return userRepository.save(user);
    }

    public User findById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("user not found"));
    }

    public AuthDto.UserResponse toUserResponse(User user) {
        return new AuthDto.UserResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getPasswordHash() != null
        );
    }

    private String sha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] bytes = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder();
            for (byte b : bytes) {
                String h = Integer.toHexString(0xff & b);
                if (h.length() == 1) hex.append('0');
                hex.append(h);
            }
            return hex.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("sha-256 not available");
        }
    }
}
