package be.mela.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;

@Entity
@Table(name = "canvas_strokes")
public class CanvasStroke {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    private Long userId;

    @Column(columnDefinition = "TEXT")
    private String points;

    private String color = "#252422";

    private double strokeWidth = 4;

    public CanvasStroke() {}

    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getPoints() { return points; }
    public void setPoints(String points) { this.points = points; }
    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }
    public double getStrokeWidth() { return strokeWidth; }
    public void setStrokeWidth(double strokeWidth) { this.strokeWidth = strokeWidth; }
}
