package be.mela.service;

import be.mela.dto.BoardDto;
import be.mela.dto.StringDto;
import be.mela.dto.UserSummaryDto;
import be.mela.model.Admin;
import be.mela.repository.AdminRepository;
import be.mela.repository.NoteRepository;
import be.mela.repository.StringRepository;
import be.mela.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AdminService {

    private final AdminRepository adminRepository;
    private final UserRepository userRepository;
    private final NoteRepository noteRepository;
    private final StringRepository stringRepository;
    private final NoteService noteService;
    private final CanvasStrokeService canvasStrokeService;
    private final PasswordEncoder passwordEncoder;

    public AdminService(AdminRepository adminRepository, UserRepository userRepository,
                        NoteRepository noteRepository, StringRepository stringRepository,
                        NoteService noteService, CanvasStrokeService canvasStrokeService,
                        PasswordEncoder passwordEncoder) {
        this.adminRepository = adminRepository;
        this.userRepository = userRepository;
        this.noteRepository = noteRepository;
        this.stringRepository = stringRepository;
        this.noteService = noteService;
        this.canvasStrokeService = canvasStrokeService;
        this.passwordEncoder = passwordEncoder;
    }

    public Admin findAdmin(String username) {
        return adminRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("admin not found"));
    }

    public boolean validateCredentials(String username, String password) {
        return adminRepository.findByUsername(username)
                .map(a -> passwordEncoder.matches(password, a.getPasswordHash()))
                .orElse(false);
    }

    public void updateCredentials(Long adminId, String newUsername, String newPassword) {
        Admin admin = adminRepository.findById(adminId)
                .orElseThrow(() -> new RuntimeException("admin not found"));
        admin.setUsername(newUsername);
        admin.setPasswordHash(passwordEncoder.encode(newPassword));
        adminRepository.save(admin);
    }

    public List<UserSummaryDto> getUsers() {
        return userRepository.findAll().stream()
                .map(u -> new UserSummaryDto(u.getId(), u.getUsername(), u.getEmail(), u.getCreatedAt().toString()))
                .toList();
    }

    public BoardDto getUserBoard(Long userId) {
        var notes = noteService.getAllNotes(userId);
        var strings = stringRepository.findAllByUserId(userId).stream()
                .map(s -> new StringDto(s.getId(), s.getX1(), s.getY1(), s.getX2(), s.getY2(), s.getColor(), s.getLabel(), s.getNoteId1(), s.getNoteId2(), s.getStyle()))
                .toList();
        var strokes = canvasStrokeService.getAll(userId);
        return new BoardDto(notes, strings, strokes);
    }

    public void deleteUser(Long userId) {
        noteRepository.deleteAllByUserId(userId);
        stringRepository.deleteAllByUserId(userId);
        canvasStrokeService.deleteAll(userId);
        userRepository.deleteById(userId);
    }
}
