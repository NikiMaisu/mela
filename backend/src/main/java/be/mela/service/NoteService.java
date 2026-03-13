package be.mela.service;

import be.mela.dto.NoteDto;
import be.mela.model.Note;
import be.mela.repository.NoteRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class NoteService {

    private final NoteRepository noteRepository;
    private final ObjectMapper objectMapper;

    public NoteService(NoteRepository noteRepository, ObjectMapper objectMapper) {
        this.noteRepository = noteRepository;
        this.objectMapper = objectMapper;
    }

    public List<NoteDto> getAllNotes(Long userId) {
        return noteRepository.findAllByUserId(userId).stream().map(this::toDto).toList();
    }

    public NoteDto createNote(NoteDto dto, Long userId) {
        Note note = new Note();
        note.setUserId(userId);
        applyDto(note, dto);
        return toDto(noteRepository.save(note));
    }

    public NoteDto updateNote(Long id, NoteDto dto, Long userId) {
        Note note = noteRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new RuntimeException("note not found"));
        applyDto(note, dto);
        return toDto(noteRepository.save(note));
    }

    public void deleteNote(Long id, Long userId) {
        noteRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new RuntimeException("note not found"));
        noteRepository.deleteById(id);
    }

    private void applyDto(Note note, NoteDto dto) {
        note.setX(dto.getX());
        note.setY(dto.getY());
        note.setWidth(dto.getWidth());
        note.setHeight(dto.getHeight());
        note.setContent(dto.getContent());
        note.setColor(dto.getColor());
        note.setDrawings(jsonToString(dto.getDrawings()));
    }

    private NoteDto toDto(Note note) {
        NoteDto dto = new NoteDto();
        dto.setId(note.getId());
        dto.setX(note.getX());
        dto.setY(note.getY());
        dto.setWidth(note.getWidth());
        dto.setHeight(note.getHeight());
        dto.setContent(note.getContent());
        dto.setColor(note.getColor());
        dto.setDrawings(stringToJson(note.getDrawings()));
        dto.setCreatedAt(note.getCreatedAt());
        return dto;
    }

    private String jsonToString(JsonNode node) {
        if (node == null) return "[]";
        try {
            return objectMapper.writeValueAsString(node);
        } catch (JsonProcessingException e) {
            return "[]";
        }
    }

    private JsonNode stringToJson(String raw) {
        if (raw == null || raw.isBlank()) {
            try { return objectMapper.readTree("[]"); } catch (Exception e) { return null; }
        }
        try {
            return objectMapper.readTree(raw);
        } catch (JsonProcessingException e) {
            try { return objectMapper.readTree("[]"); } catch (Exception ex) { return null; }
        }
    }
}
