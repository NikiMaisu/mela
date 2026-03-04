package be.mela.controller;

import be.mela.dto.NoteDto;
import be.mela.service.NoteService;
import org.springframework.http.ResponseEntity;
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
    public List<NoteDto> getAllNotes() {
        return noteService.getAllNotes();
    }

    @PostMapping
    public NoteDto createNote(@RequestBody NoteDto dto) {
        return noteService.createNote(dto);
    }

    @PutMapping("/{id}")
    public NoteDto updateNote(@PathVariable Long id, @RequestBody NoteDto dto) {
        return noteService.updateNote(id, dto);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNote(@PathVariable Long id) {
        noteService.deleteNote(id);
        return ResponseEntity.noContent().build();
    }
}
