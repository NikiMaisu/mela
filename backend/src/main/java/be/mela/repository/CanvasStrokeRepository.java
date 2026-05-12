package be.mela.repository;

import be.mela.model.CanvasStroke;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CanvasStrokeRepository extends JpaRepository<CanvasStroke, Long> {
    List<CanvasStroke> findAllByUserId(Long userId);
    Optional<CanvasStroke> findByIdAndUserId(Long id, Long userId);
    void deleteAllByUserId(Long userId);
}
