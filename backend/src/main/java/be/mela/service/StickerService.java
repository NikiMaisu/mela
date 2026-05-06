package be.mela.service;

import be.mela.dto.StickerDto;
import be.mela.model.Sticker;
import be.mela.repository.StickerRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class StickerService {

    private final StickerRepository stickerRepository;

    public StickerService(StickerRepository stickerRepository) {
        this.stickerRepository = stickerRepository;
    }

    public List<StickerDto> getAll(Long userId) {
        return stickerRepository.findAllByUserId(userId).stream().map(this::toDto).toList();
    }

    public StickerDto create(StickerDto dto, Long userId) {
        Sticker s = new Sticker();
        s.setUserId(userId);
        apply(s, dto);
        return toDto(stickerRepository.save(s));
    }

    public StickerDto update(Long id, StickerDto dto, Long userId) {
        Sticker s = stickerRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new RuntimeException("sticker not found"));
        apply(s, dto);
        return toDto(stickerRepository.save(s));
    }

    public void delete(Long id, Long userId) {
        stickerRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new RuntimeException("sticker not found"));
        stickerRepository.deleteById(id);
    }

    private void apply(Sticker s, StickerDto dto) {
        s.setX(dto.getX());
        s.setY(dto.getY());
        s.setRotation(dto.getRotation());
        s.setScale(dto.getScale());
        if (dto.getEmoji() != null) s.setEmoji(dto.getEmoji());
    }

    private StickerDto toDto(Sticker s) {
        StickerDto dto = new StickerDto();
        dto.setId(s.getId());
        dto.setX(s.getX());
        dto.setY(s.getY());
        dto.setRotation(s.getRotation());
        dto.setScale(s.getScale());
        dto.setEmoji(s.getEmoji());
        return dto;
    }
}
