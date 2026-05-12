package be.mela.dto;

import com.fasterxml.jackson.databind.JsonNode;

public class CanvasStrokeDto {
    private Long id;
    private JsonNode points;
    private String color = "#252422";
    private double strokeWidth = 4;

    public CanvasStrokeDto() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public JsonNode getPoints() { return points; }
    public void setPoints(JsonNode points) { this.points = points; }
    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }
    public double getStrokeWidth() { return strokeWidth; }
    public void setStrokeWidth(double strokeWidth) { this.strokeWidth = strokeWidth; }
}
