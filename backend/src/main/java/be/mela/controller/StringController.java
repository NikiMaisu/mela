package be.mela.controller;

import be.mela.dto.StringDto;
import be.mela.model.UserPrincipal;
import be.mela.service.StringService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/strings")
public class StringController {

    private final StringService stringService;

    public StringController(StringService stringService) {
        this.stringService = stringService;
    }

    @GetMapping
    public List<StringDto> getAllStrings(@AuthenticationPrincipal UserPrincipal principal) {
        return stringService.getAllStrings(principal.getId());
    }

    @PostMapping
    public StringDto createString(@RequestBody StringDto dto, @AuthenticationPrincipal UserPrincipal principal) {
        return stringService.createString(dto, principal.getId());
    }

    @PatchMapping("/{id}/color")
    public StringDto updateColor(@PathVariable Long id, @RequestBody java.util.Map<String, String> body, @AuthenticationPrincipal UserPrincipal principal) {
        return stringService.updateStringColor(id, body.get("color"), principal.getId());
    }

    @PatchMapping("/{id}/label")
    public StringDto updateLabel(@PathVariable Long id, @RequestBody java.util.Map<String, String> body, @AuthenticationPrincipal UserPrincipal principal) {
        return stringService.updateStringLabel(id, body.get("label"), principal.getId());
    }

    @PatchMapping("/{id}/style")
    public StringDto updateStyle(@PathVariable Long id, @RequestBody java.util.Map<String, String> body, @AuthenticationPrincipal UserPrincipal principal) {
        return stringService.updateStringStyle(id, body.get("style"), principal.getId());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteString(@PathVariable Long id, @AuthenticationPrincipal UserPrincipal principal) {
        stringService.deleteString(id, principal.getId());
        return ResponseEntity.noContent().build();
    }
}
