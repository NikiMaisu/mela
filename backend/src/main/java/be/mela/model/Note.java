package be.mela.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

@Entity
@Table(name = "notes")
public class Note {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    private double x;

    @NotNull
    private double y;

    private double width = 208;
    private double height = 120;

    @Column(columnDefinition = "TEXT")
    private String content;

    private String color;

    private double rotation = 0;

    private String shape = "rectangle";

    @Column(columnDefinition = "TEXT")
    private String drawings;

    @Column(nullable = false)
    private Long userId;

    @NotNull
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    public Note() {}

    public Long getId() { return id; }
    public double getX() { return x; }
    public void setX(double x) { this.x = x; }
    public double getY() { return y; }
    public void setY(double y) { this.y = y; }
    public double getWidth() { return width; }
    public void setWidth(double width) { this.width = width; }
    public double getHeight() { return height; }
    public void setHeight(double height) { this.height = height; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }
    public double getRotation() { return rotation; }
    public void setRotation(double rotation) { this.rotation = rotation; }
    public String getShape() { return shape; }
    public void setShape(String shape) { this.shape = shape; }
    public String getDrawings() { return drawings; }
    public void setDrawings(String drawings) { this.drawings = drawings; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
