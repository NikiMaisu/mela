package be.mela.dto;

import java.util.List;

public class BoardDto {

    private List<NoteDto> notes;
    private List<StringDto> strings;

    public BoardDto(List<NoteDto> notes, List<StringDto> strings) {
        this.notes = notes;
        this.strings = strings;
    }

    public List<NoteDto> getNotes() { return notes; }
    public List<StringDto> getStrings() { return strings; }
}
