package synelix_backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import synelix_backend.service.RoadmapService;

import java.util.Map;

@RestController
@RequestMapping("/api/students/roadmap")
public class RoadmapController {

    private final RoadmapService roadmapService;

    public RoadmapController(RoadmapService roadmapService) {
        this.roadmapService = roadmapService;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getRoadmap(
            Authentication authentication,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String targetRole) {
        return ResponseEntity.ok(roadmapService.getRoadmap(
                StudentController.subject(authentication, email), targetRole));
    }

    @PostMapping("/toggle")
    public ResponseEntity<Map<String, Object>> toggleTask(
            Authentication authentication,
            @RequestParam(required = false) String email,
            @RequestParam String taskId,
            @RequestParam(required = false) Boolean done) {
        return ResponseEntity.ok(roadmapService.toggleTask(
                StudentController.subject(authentication, email), taskId, done));
    }
}
