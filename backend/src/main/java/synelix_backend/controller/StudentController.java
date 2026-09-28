package synelix_backend.controller;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.*;
import synelix_backend.dto.ResumeAnalyzeRequest;
import synelix_backend.dto.ResumeAnalyzeResponse;
import synelix_backend.dto.SkillGapResponse;
import synelix_backend.dto.StudentProfileRequest;
import synelix_backend.entity.Role;
import synelix_backend.entity.StudentProfile;
import synelix_backend.exception.BadRequestException;
import synelix_backend.service.CompanyService;
import synelix_backend.service.StudentService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/students")
public class StudentController {

    private final StudentService studentService;
    private final CompanyService companyService;

    public StudentController(StudentService studentService, CompanyService companyService) {
        this.studentService = studentService;
        this.companyService = companyService;
    }

    @GetMapping("/profile")
    public ResponseEntity<StudentProfile> getProfile(
            Authentication authentication,
            @RequestParam(required = false) String email) {
        return ResponseEntity.ok(studentService.getProfile(subject(authentication, email)));
    }

    @PutMapping("/profile")
    public ResponseEntity<StudentProfile> saveProfile(
            Authentication authentication,
            @Valid @RequestBody StudentProfileRequest request) {
        request.setEmail(subject(authentication, request.getEmail()));
        return ResponseEntity.ok(studentService.saveProfile(request));
    }

    @GetMapping("/skill-gap")
    public ResponseEntity<SkillGapResponse> getSkillGap(
            Authentication authentication,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String targetRole) {
        return ResponseEntity.ok(
                studentService.getSkillGap(subject(authentication, email), targetRole));
    }

    /** POST kept alongside GET because the existing frontend calls it with POST. */
    @PostMapping("/skill-gap")
    public ResponseEntity<SkillGapResponse> postSkillGap(
            Authentication authentication,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String targetRole) {
        return getSkillGap(authentication, email, targetRole);
    }

    @PostMapping("/resume/analyze")
    public ResponseEntity<ResumeAnalyzeResponse> analyzeResume(
            Authentication authentication,
            @RequestBody(required = false) ResumeAnalyzeRequest request) {
        return ResponseEntity.ok(
                studentService.analyzeResume(subject(authentication, null), request));
    }

    /** Companies matched to this student by the ML matcher. */
    @GetMapping("/matched-companies")
    public ResponseEntity<List<Map<String, Object>>> matchedCompanies(
            Authentication authentication,
            @RequestParam(required = false) String email,
            @RequestParam(defaultValue = "8") int limit) {
        return ResponseEntity.ok(companyService.getMatchedCompanies(
                subject(authentication, email), limit));
    }

    /**
     * Which student this request is allowed to act on.
     *
     * <p>A student is always pinned to their own token subject: passing
     * someone else's address in {@code ?email=} is rejected rather than
     * silently honoured. Only an institution account, which is meant to
     * oversee the whole cohort, may look up an arbitrary student.</p>
     */
    static String subject(Authentication authentication, String requestedEmail) {
        String principal = authentication == null ? null : authentication.getName();

        if (requestedEmail == null || requestedEmail.isBlank()
                || requestedEmail.equalsIgnoreCase(principal)) {
            return principal;
        }

        boolean isInstitution = authentication != null && authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(("ROLE_" + Role.INSTITUTION.name())::equals);

        if (!isInstitution) {
            throw new BadRequestException(
                    "You can only access your own student record");
        }
        return requestedEmail;
    }
}
