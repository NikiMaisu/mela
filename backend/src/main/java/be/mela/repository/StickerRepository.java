package be.mela.repository;

import be.mela.model.Sticker;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StickerRepository extends JpaRepository<Sticker, Long> {
    List<Sticker> findAllByUserId(Long userId);
    Optional<Sticker> findByIdAndUserId(Long id, Long userId);
    void deleteAllByUserId(Long userId);
}
