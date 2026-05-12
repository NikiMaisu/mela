package be.mela.service;

import be.mela.dto.CanvasStrokeDto;
import be.mela.model.CanvasStroke;
import be.mela.repository.CanvasStrokeRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CanvasStrokeService {

    private final CanvasStrokeRepository repo;
    private final ObjectMapper mapper;

    public CanvasStrokeService(CanvasStrokeRepository repo, ObjectMapper mapper) {
        this.repo = repo;
        this.mapper = mapper;
    }

    public List<CanvasStrokeDto> getAll(Long userId) {
        return repo.findAllByUserId(userId).stream().map(this::toDto).toList();
    }

    public CanvasStrokeDto create(CanvasStrokeDto dto, Long userId) {
        CanvasStroke s = new CanvasStroke();
        s.setUserId(userId);
        apply(s, dto);
        return toDto(repo.save(s));
    }

    public void delete(Long id, Long userId) {
        repo.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new RuntimeException("stroke not found"));
        repo.deleteById(id);
    }

    public void deleteAll(Long userId) {
        repo.deleteAllByUserId(userId);
    }

    private void apply(CanvasStroke s, CanvasStrokeDto dto) {
        try {
            s.setPoints(mapper.writeValueAsString(dto.getPoints()));
        } catch (Exception e) {
            s.setPoints("[]");
        }
        if (dto.getColor() != null) s.setColor(dto.getColor());
        s.setStrokeWidth(dto.getStrokeWidth());
    }

    private CanvasStrokeDto toDto(CanvasStroke s) {
        CanvasStrokeDto dto = new CanvasStrokeDto();
        dto.setId(s.getId());
        try {
            dto.setPoints(mapper.readTree(s.getPoints() != null ? s.getPoints() : "[]"));
        } catch (Exception e) {
            dto.setPoints(mapper.nullNode());
        }
        dto.setColor(s.getColor());
        dto.setStrokeWidth(s.getStrokeWidth());
        return dto;
    }
}
