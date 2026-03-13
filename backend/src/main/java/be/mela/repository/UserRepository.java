package be.mela.repository;

import be.mela.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByCodeHash(String codeHash);
    Optional<User> findByEmail(String email);
}
