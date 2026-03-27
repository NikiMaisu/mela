package be.mela.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;

@Entity
@Table(name = "strings")
public class StringConnection {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    private Long userId;

    @NotNull
    private double x1;

    @NotNull
    private double y1;

    @NotNull
    private double x2;

    @NotNull
    private double y2;

    private String color = "#A81C07";

    private String label;

    private Long noteId1;

    private Long noteId2;

    public StringConnection() {}

    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
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
