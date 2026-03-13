package be.mela.controller;

import be.mela.dto.AuthDto;
import be.mela.model.User;
import be.mela.model.UserPrincipal;
import be.mela.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/generate")
    public ResponseEntity<AuthDto.GenerateResponse> generate(HttpServletRequest request) {
        String rawCode = authService.generateRawCode();
        User user = authService.createUserWithCode(rawCode);
        createSession(request, user);
        AuthDto.UserResponse info = authService.toUserResponse(user);
        return ResponseEntity.ok(new AuthDto.GenerateResponse(rawCode, info.getId(), info.getUsername(), info.getEmail(), info.isHasCredentials()));
    }

    @PostMapping("/login/code")
    public ResponseEntity<AuthDto.UserResponse> loginWithCode(@RequestBody AuthDto.LoginCodeRequest body, HttpServletRequest request) {
        User user = authService.loginWithCode(body.getCode());
        createSession(request, user);
        return ResponseEntity.ok(authService.toUserResponse(user));
    }

    @PostMapping("/login/credentials")
    public ResponseEntity<AuthDto.UserResponse> loginWithCredentials(@RequestBody AuthDto.LoginCredentialsRequest body, HttpServletRequest request) {
        User user = authService.loginWithCredentials(body.getEmail(), body.getPassword());
        createSession(request, user);
        return ResponseEntity.ok(authService.toUserResponse(user));
    }

    @PutMapping("/upgrade")
    public ResponseEntity<AuthDto.UserResponse> upgrade(@RequestBody AuthDto.UpgradeRequest body, @AuthenticationPrincipal UserPrincipal principal) {
        User user = authService.upgrade(principal.getId(), body.getUsername(), body.getEmail(), body.getPassword());
        return ResponseEntity.ok(authService.toUserResponse(user));
    }

    @GetMapping("/me")
    public ResponseEntity<AuthDto.UserResponse> me(@AuthenticationPrincipal UserPrincipal principal) {
        if (principal == null) return ResponseEntity.status(401).build();
        User user = authService.findById(principal.getId());
        return ResponseEntity.ok(authService.toUserResponse(user));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session != null) session.invalidate();
        SecurityContextHolder.clearContext();
        return ResponseEntity.noContent().build();
    }

    private void createSession(HttpServletRequest request, User user) {
        UserPrincipal principal = new UserPrincipal(user);
        Authentication auth = new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(auth);
        request.getSession(true).setAttribute(
                HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY,
                SecurityContextHolder.getContext()
        );
    }
}
