package be.mela.dto;

import java.util.List;

public class BoardDto {

    private List<NoteDto> notes;
    private List<StringDto> strings;
    private List<CanvasStrokeDto> strokes;

    public BoardDto(List<NoteDto> notes, List<StringDto> strings, List<CanvasStrokeDto> strokes) {
        this.notes = notes;
        this.strings = strings;
        this.strokes = strokes;
    }

    public List<NoteDto> getNotes() { return notes; }
    public List<StringDto> getStrings() { return strings; }
    public List<CanvasStrokeDto> getStrokes() { return strokes; }
}
