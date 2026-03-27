package be.mela.service;

import be.mela.dto.StringDto;
import be.mela.model.StringConnection;
import be.mela.repository.StringRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class StringService {

    private final StringRepository stringRepository;

    public StringService(StringRepository stringRepository) {
        this.stringRepository = stringRepository;
    }

    public List<StringDto> getAllStrings(Long userId) {
        return stringRepository.findAllByUserId(userId).stream().map(this::toDto).toList();
    }

    public StringDto createString(StringDto dto, Long userId) {
        StringConnection s = new StringConnection();
        s.setUserId(userId);
        s.setX1(dto.getX1());
        s.setY1(dto.getY1());
        s.setX2(dto.getX2());
        s.setY2(dto.getY2());
        if (dto.getColor() != null) s.setColor(dto.getColor());
        if (dto.getLabel() != null) s.setLabel(dto.getLabel());
        s.setNoteId1(dto.getNoteId1());
        s.setNoteId2(dto.getNoteId2());
        return toDto(stringRepository.save(s));
    }

    public StringDto updateStringColor(Long id, String color, Long userId) {
        StringConnection s = stringRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new RuntimeException("string not found"));
        s.setColor(color);
        return toDto(stringRepository.save(s));
    }

    public StringDto updateStringLabel(Long id, String label, Long userId) {
        StringConnection s = stringRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new RuntimeException("string not found"));
        s.setLabel(label);
        return toDto(stringRepository.save(s));
    }

    public void deleteString(Long id, Long userId) {
        stringRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new RuntimeException("string not found"));
        stringRepository.deleteById(id);
    }

    private StringDto toDto(StringConnection s) {
        return new StringDto(s.getId(), s.getX1(), s.getY1(), s.getX2(), s.getY2(), s.getColor(), s.getLabel(), s.getNoteId1(), s.getNoteId2());
    }
}
