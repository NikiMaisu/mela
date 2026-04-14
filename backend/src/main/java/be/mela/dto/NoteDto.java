package be.mela.dto;

import com.fasterxml.jackson.databind.JsonNode;
import java.time.LocalDateTime;

public class NoteDto {

    private Long id;
    private double x;
    private double y;
    private double width = 208;
    private double height = 120;
    private String content;
    private String color;
    private double rotation = 0;
    private String shape = "rectangle";
    private JsonNode drawings;
    private LocalDateTime createdAt;

    public NoteDto() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
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
    public JsonNode getDrawings() { return drawings; }
    public void setDrawings(JsonNode drawings) { this.drawings = drawings; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
