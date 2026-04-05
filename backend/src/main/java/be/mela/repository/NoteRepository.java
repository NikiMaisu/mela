package be.mela.repository;

import be.mela.model.Note;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface NoteRepository extends JpaRepository<Note, Long> {
    List<Note> findAllByUserId(Long userId);
    Optional<Note> findByIdAndUserId(Long id, Long userId);
    void deleteAllByUserId(Long userId);
}
