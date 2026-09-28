package synelix_backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import synelix_backend.dto.CopilotChatRequest;
import synelix_backend.dto.CopilotChatResponse;
import synelix_backend.service.CopilotService;

@RestController
@RequestMapping("/api/copilot")
public class CopilotController {

    private final CopilotService copilotService;

    public CopilotController(CopilotService copilotService) {
        this.copilotService = copilotService;
    }

    @PostMapping("/chat")
    public ResponseEntity<CopilotChatResponse> chat(
            Authentication authentication,
            @RequestBody CopilotChatRequest request) {
        return ResponseEntity.ok(
                copilotService.processQuery(authentication.getName(), request));
    }
}
