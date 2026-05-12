package be.mela.controller;

import be.mela.dto.CanvasStrokeDto;
import be.mela.model.UserPrincipal;
import be.mela.service.CanvasStrokeService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/canvas-strokes")
public class CanvasStrokeController {

    private final CanvasStrokeService canvasStrokeService;

    public CanvasStrokeController(CanvasStrokeService canvasStrokeService) {
        this.canvasStrokeService = canvasStrokeService;
    }

    @GetMapping
    public List<CanvasStrokeDto> getAll(@AuthenticationPrincipal UserPrincipal principal) {
        return canvasStrokeService.getAll(principal.getId());
    }

    @PostMapping
    public CanvasStrokeDto create(@RequestBody CanvasStrokeDto dto, @AuthenticationPrincipal UserPrincipal principal) {
        return canvasStrokeService.create(dto, principal.getId());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, @AuthenticationPrincipal UserPrincipal principal) {
        canvasStrokeService.delete(id, principal.getId());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping
    public ResponseEntity<Void> deleteAll(@AuthenticationPrincipal UserPrincipal principal) {
        canvasStrokeService.deleteAll(principal.getId());
        return ResponseEntity.noContent().build();
    }
}
