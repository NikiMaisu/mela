package be.mela.dto;

public class AuthDto {

    public static class GenerateResponse {
        private String code;
        private Long id;
        private String username;
        private String email;
        private boolean hasCredentials;

        public GenerateResponse(String code, Long id, String username, String email, boolean hasCredentials) {
            this.code = code;
            this.id = id;
            this.username = username;
            this.email = email;
            this.hasCredentials = hasCredentials;
        }

        public String getCode() { return code; }
        public Long getId() { return id; }
        public String getUsername() { return username; }
        public String getEmail() { return email; }
        public boolean isHasCredentials() { return hasCredentials; }
    }

    public static class LoginCodeRequest {
        private String code;
        public String getCode() { return code; }
        public void setCode(String code) { this.code = code; }
    }

    public static class LoginCredentialsRequest {
        private String email;
        private String password;
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }

    public static class UpgradeRequest {
        private String username;
        private String email;
        private String password;
        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }

    public static class UserResponse {
        private Long id;
        private String username;
        private String email;
        private boolean hasCredentials;

        public UserResponse(Long id, String username, String email, boolean hasCredentials) {
            this.id = id;
            this.username = username;
            this.email = email;
            this.hasCredentials = hasCredentials;
        }

        public Long getId() { return id; }
        public String getUsername() { return username; }
        public String getEmail() { return email; }
        public boolean isHasCredentials() { return hasCredentials; }
    }
}
