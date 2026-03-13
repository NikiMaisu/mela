package be.mela.controller;

import be.mela.dto.NoteDto;
import be.mela.model.UserPrincipal;
import be.mela.service.NoteService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/notes")
public class NoteController {

    private final NoteService noteService;

    public NoteController(NoteService noteService) {
        this.noteService = noteService;
    }

    @GetMapping
    public List<NoteDto> getAllNotes(@AuthenticationPrincipal UserPrincipal principal) {
        return noteService.getAllNotes(principal.getId());
    }

    @PostMapping
    public NoteDto createNote(@RequestBody NoteDto dto, @AuthenticationPrincipal UserPrincipal principal) {
        return noteService.createNote(dto, principal.getId());
    }

    @PutMapping("/{id}")
    public NoteDto updateNote(@PathVariable Long id, @RequestBody NoteDto dto, @AuthenticationPrincipal UserPrincipal principal) {
        return noteService.updateNote(id, dto, principal.getId());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNote(@PathVariable Long id, @AuthenticationPrincipal UserPrincipal principal) {
        noteService.deleteNote(id, principal.getId());
        return ResponseEntity.noContent().build();
    }
}
