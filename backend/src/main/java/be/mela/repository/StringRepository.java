package be.mela.repository;

import be.mela.model.StringConnection;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StringRepository extends JpaRepository<StringConnection, Long> {
    List<StringConnection> findAllByUserId(Long userId);
    Optional<StringConnection> findByIdAndUserId(Long id, Long userId);
    void deleteAllByUserId(Long userId);
}
