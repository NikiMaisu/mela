package be.mela;

import be.mela.model.Admin;
import be.mela.repository.AdminRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements ApplicationRunner {

    private final AdminRepository adminRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(AdminRepository adminRepository, PasswordEncoder passwordEncoder) {
        this.adminRepository = adminRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (adminRepository.count() == 0) {
            Admin admin = new Admin();
            admin.setUsername("Niki");
            admin.setPasswordHash(passwordEncoder.encode("NikiNiki"));
            adminRepository.save(admin);
        }
    }
}
