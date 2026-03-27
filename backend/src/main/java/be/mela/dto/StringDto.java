package be.mela.dto;

public class StringDto {
    private Long id;
    private double x1;
    private double y1;
    private double x2;
    private double y2;
    private String color = "#A81C07";
    private String label;
    private Long noteId1;
    private Long noteId2;

    public StringDto() {}

    public StringDto(Long id, double x1, double y1, double x2, double y2, String color, String label, Long noteId1, Long noteId2) {
        this.id = id;
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
        this.color = color != null ? color : "#A81C07";
        this.label = label;
        this.noteId1 = noteId1;
        this.noteId2 = noteId2;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public double getX1() { return x1; }
    public void setX1(double x1) { this.x1 = x1; }
    public double getY1() { return y1; }
    public void setY1(double y1) { this.y1 = y1; }
    public double getX2() { return x2; }
    public void setX2(double x2) { this.x2 = x2; }
    public double getY2() { return y2; }
    public void setY2(double y2) { this.y2 = y2; }
    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }
    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }
    public Long getNoteId1() { return noteId1; }
    public void setNoteId1(Long noteId1) { this.noteId1 = noteId1; }
    public Long getNoteId2() { return noteId2; }
    public void setNoteId2(Long noteId2) { this.noteId2 = noteId2; }
}
