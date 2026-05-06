package be.mela.controller;

import be.mela.dto.StickerDto;
import be.mela.model.UserPrincipal;
import be.mela.service.StickerService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/stickers")
public class StickerController {

    private final StickerService stickerService;

    public StickerController(StickerService stickerService) {
        this.stickerService = stickerService;
    }

    @GetMapping
    public List<StickerDto> getAll(@AuthenticationPrincipal UserPrincipal principal) {
        return stickerService.getAll(principal.getId());
    }

    @PostMapping
    public StickerDto create(@RequestBody StickerDto dto, @AuthenticationPrincipal UserPrincipal principal) {
        return stickerService.create(dto, principal.getId());
    }

    @PutMapping("/{id}")
    public StickerDto update(@PathVariable Long id, @RequestBody StickerDto dto, @AuthenticationPrincipal UserPrincipal principal) {
        return stickerService.update(id, dto, principal.getId());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, @AuthenticationPrincipal UserPrincipal principal) {
        stickerService.delete(id, principal.getId());
        return ResponseEntity.noContent().build();
    }
}
