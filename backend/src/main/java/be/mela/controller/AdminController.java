package be.mela.controller;

import be.mela.dto.AdminDto;
import be.mela.model.Admin;
import be.mela.service.AdminService;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/admin")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    private Long requireAdmin(HttpSession session) {
        Object adminId = session.getAttribute("ADMIN_ID");
        if (adminId == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        return (Long) adminId;
    }

    @PostMapping("/login")
    public ResponseEntity<Void> login(@RequestBody AdminDto dto, HttpSession session) {
        if (!adminService.validateCredentials(dto.getUsername(), dto.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        Admin admin = adminService.findAdmin(dto.getUsername());
        session.setAttribute("ADMIN_ID", admin.getId());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpSession session) {
        session.removeAttribute("ADMIN_ID");
        return ResponseEntity.ok().build();
    }

    @GetMapping("/me")
    public ResponseEntity<Void> me(HttpSession session) {
        requireAdmin(session);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/users")
    public ResponseEntity<?> getUsers(HttpSession session) {
        requireAdmin(session);
        return ResponseEntity.ok(adminService.getUsers());
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<?> getUserBoard(@PathVariable Long id, HttpSession session) {
        requireAdmin(session);
        return ResponseEntity.ok(adminService.getUserBoard(id));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id, HttpSession session) {
        requireAdmin(session);
        adminService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/credentials")
    public ResponseEntity<Void> updateCredentials(@RequestBody AdminDto dto, HttpSession session) {
        Long adminId = requireAdmin(session);
        adminService.updateCredentials(adminId, dto.getUsername(), dto.getPassword());
        return ResponseEntity.ok().build();
    }
}
