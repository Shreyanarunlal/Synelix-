package synelix_backend.controller;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import synelix_backend.dto.CampusDriveRequest;
import synelix_backend.entity.CampusDrive;
import synelix_backend.entity.StudentProfile;
import synelix_backend.service.InstitutionService;
import synelix_backend.service.StudentService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/institution")
public class InstitutionController {

    private final InstitutionService institutionService;
    private final StudentService studentService;

    public InstitutionController(InstitutionService institutionService,
                                 StudentService studentService) {
        this.institutionService = institutionService;
        this.studentService = studentService;
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        return ResponseEntity.ok(institutionService.getStats());
    }

    @GetMapping("/departments")
    public ResponseEntity<List<Map<String, Object>>> getDepartments() {
        return ResponseEntity.ok(institutionService.getDepartments());
    }

    @GetMapping("/students")
    public ResponseEntity<List<StudentProfile>> getStudents() {
        return ResponseEntity.ok(studentService.getAll());
    }

    @GetMapping("/drives")
    public ResponseEntity<List<CampusDrive>> getDrives() {
        return ResponseEntity.ok(institutionService.getDrives());
    }

    @PostMapping("/drives")
    public ResponseEntity<CampusDrive> scheduleDrive(@Valid @RequestBody CampusDriveRequest request) {
        return ResponseEntity.ok(institutionService.scheduleDrive(request));
    }

    @GetMapping("/audit-report")
    public ResponseEntity<Map<String, Object>> getAuditReport() {
        return ResponseEntity.ok(institutionService.getAuditReport());
    }
}
