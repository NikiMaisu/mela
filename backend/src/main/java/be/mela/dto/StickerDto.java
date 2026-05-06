package be.mela.dto;

public class StickerDto {
    private Long id;
    private double x;
    private double y;
    private double rotation;
    private double scale = 1;
    private String emoji;

    public StickerDto() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public double getX() { return x; }
    public void setX(double x) { this.x = x; }
    public double getY() { return y; }
    public void setY(double y) { this.y = y; }
    public double getRotation() { return rotation; }
    public void setRotation(double rotation) { this.rotation = rotation; }
    public double getScale() { return scale; }
    public void setScale(double scale) { this.scale = scale; }
    public String getEmoji() { return emoji; }
    public void setEmoji(String emoji) { this.emoji = emoji; }
}
