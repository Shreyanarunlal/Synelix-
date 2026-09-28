package synelix_backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import synelix_backend.service.CompanyService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/companies")
public class CompanyController {

    private final CompanyService companyService;

    public CompanyController(CompanyService companyService) {
        this.companyService = companyService;
    }

    /**
     * Recruiter candidate search over the real student table.
     *
     * <p>Shortlist state is scoped to the calling recruiter, so the flag each
     * company sees reflects their own shortlist and not another firm's.</p>
     */
    @GetMapping("/candidates")
    public ResponseEntity<List<Map<String, Object>>> getCandidates(
            Authentication authentication,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String department,
            @RequestParam(required = false) Integer minScore) {
        return ResponseEntity.ok(companyService.getCandidates(
                authentication.getName(), search, department, minScore));
    }

    @GetMapping("/candidates/{id}")
    public ResponseEntity<Map<String, Object>> getCandidateById(
            Authentication authentication,
            @PathVariable String id) {
        return ResponseEntity.ok(
                companyService.getCandidateById(authentication.getName(), id));
    }

    @PostMapping("/candidates/{id}/shortlist")
    public ResponseEntity<Map<String, Object>> toggleShortlist(
            Authentication authentication,
            @PathVariable String id) {
        return ResponseEntity.ok(
                companyService.toggleShortlist(authentication.getName(), id));
    }

    @GetMapping("/shortlisted")
    public ResponseEntity<List<Map<String, Object>>> getShortlisted(Authentication authentication) {
        return ResponseEntity.ok(companyService.getShortlisted(authentication.getName()));
    }

    /**
     * Companies matched to one student.
     *
     * <p>Requires the student email, because a match score is meaningless
     * without a candidate to score against.</p>
     */
    @GetMapping("/matched")
    public ResponseEntity<List<Map<String, Object>>> getMatchedCompanies(
            @RequestParam String email,
            @RequestParam(defaultValue = "8") int limit) {
        return ResponseEntity.ok(companyService.getMatchedCompanies(email, limit));
    }
}
