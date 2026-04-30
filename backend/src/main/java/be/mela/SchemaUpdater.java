package be.mela;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class SchemaUpdater implements ApplicationRunner {

    private final JdbcTemplate jdbc;

    public SchemaUpdater(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public void run(ApplicationArguments args) {
        jdbc.execute("ALTER TABLE notes ADD COLUMN IF NOT EXISTS rotation DOUBLE DEFAULT 0");
        jdbc.execute("ALTER TABLE strings ADD COLUMN IF NOT EXISTS color VARCHAR(32) DEFAULT '#A81C07'");
        jdbc.execute("ALTER TABLE strings ADD COLUMN IF NOT EXISTS label VARCHAR(255)");
        jdbc.execute("ALTER TABLE strings ADD COLUMN IF NOT EXISTS note_id1 BIGINT");
        jdbc.execute("ALTER TABLE strings ADD COLUMN IF NOT EXISTS note_id2 BIGINT");
        jdbc.execute("ALTER TABLE strings ADD COLUMN IF NOT EXISTS style VARCHAR(32) DEFAULT 'thread'");
        jdbc.execute("ALTER TABLE notes ADD COLUMN IF NOT EXISTS shape VARCHAR(32) DEFAULT 'rectangle'");
    }
}
