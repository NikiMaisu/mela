package be.mela.dto;

public class UserSummaryDto {

    private Long id;
    private String username;
    private String email;
    private String createdAt;

    public UserSummaryDto(Long id, String username, String email, String createdAt) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public String getUsername() { return username; }
    public String getEmail() { return email; }
    public String getCreatedAt() { return createdAt; }
}
