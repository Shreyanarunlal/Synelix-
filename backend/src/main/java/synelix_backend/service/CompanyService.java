package synelix_backend.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import synelix_backend.entity.Shortlist;
import synelix_backend.entity.StudentProfile;
import synelix_backend.entity.StudentSkill;
import synelix_backend.exception.ResourceNotFoundException;
import synelix_backend.ml.MlClient;
import synelix_backend.ml.ProfilePayload;
import synelix_backend.repository.ShortlistRepository;
import synelix_backend.repository.StudentProfileRepository;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Recruiter-facing services: candidate search, shortlisting, and the
 * ML-matched company list a student sees.
 */
@Service
public class CompanyService {

    private static final int TOP_SKILLS_SHOWN = 5;

    private final StudentProfileRepository studentProfileRepository;
    private final ShortlistRepository shortlistRepository;
    private final MlClient mlClient;

    public CompanyService(StudentProfileRepository studentProfileRepository,
                          ShortlistRepository shortlistRepository,
                          MlClient mlClient) {
        this.studentProfileRepository = studentProfileRepository;
        this.shortlistRepository = shortlistRepository;
        this.mlClient = mlClient;
    }

    // ------------------------------------------------------------------
    // Company matching (student view)
    // ------------------------------------------------------------------

    /**
     * Companies matched to one student by the ML matcher.
     *
     * <p>When the ML service is down this returns an empty list rather than a
     * fabricated one: a match score is the whole point of this endpoint, and
     * inventing scores would be worse than showing nothing.</p>
     */
    public List<Map<String, Object>> getMatchedCompanies(String studentEmail, int limit) {
        StudentProfile profile = studentProfileRepository.findByEmail(studentEmail)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No student profile found for " + studentEmail));

        return mlClient.matchJobs(ProfilePayload.from(profile), limit)
                .orElseGet(List::of);
    }

    // ------------------------------------------------------------------
    // Candidate search (recruiter view)
    // ------------------------------------------------------------------

    public List<Map<String, Object>> getCandidates(String recruiterEmail, String search,
                                                   String department, Integer minScore) {
        String normalisedSearch = blankToNull(search);
        String normalisedDept = blankToNull(department);
        if (normalisedDept != null && normalisedDept.equalsIgnoreCase("All")) {
            normalisedDept = null;
        }

        List<StudentProfile> profiles =
                studentProfileRepository.search(normalisedSearch, normalisedDept, minScore);

        Set<Long> shortlisted = shortlistedIds(recruiterEmail);

        return profiles.stream()
                .map(profile -> toCandidate(profile, shortlisted))
                .collect(Collectors.toList());
    }

    public Map<String, Object> getCandidateById(String recruiterEmail, String id) {
        StudentProfile profile = resolveStudent(id);
        return toCandidate(profile, shortlistedIds(recruiterEmail));
    }

    @Transactional
    public Map<String, Object> toggleShortlist(String recruiterEmail, String id) {
        StudentProfile profile = resolveStudent(id);

        Optional<Shortlist> existing = shortlistRepository
                .findByRecruiterEmailAndStudentId(recruiterEmail, profile.getId());

        boolean nowShortlisted;
        if (existing.isPresent()) {
            shortlistRepository.delete(existing.get());
            nowShortlisted = false;
        } else {
            shortlistRepository.save(new Shortlist(recruiterEmail, profile.getId(), "Shortlisted"));
            nowShortlisted = true;
        }

        Map<String, Object> result = new HashMap<>();
        result.put("id", profile.getId());
        result.put("name", profile.getName());
        result.put("shortlisted", nowShortlisted);
        result.put("success", true);
        result.put("message", profile.getName()
                + (nowShortlisted ? " added to your shortlist" : " removed from your shortlist"));
        return result;
    }

    public List<Map<String, Object>> getShortlisted(String recruiterEmail) {
        Set<Long> ids = shortlistedIds(recruiterEmail);
        if (ids.isEmpty()) {
            return List.of();
        }
        return studentProfileRepository.findAllById(ids).stream()
                .map(profile -> toCandidate(profile, ids))
                .collect(Collectors.toList());
    }

    // ------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------

    /**
     * Accepts either the numeric id or the display id shown in the UI
     * ("STU-001"), because the recruiter table renders the latter.
     */
    private StudentProfile resolveStudent(String id) {
        if (id == null || id.isBlank()) {
            throw new ResourceNotFoundException("A candidate id is required");
        }
        String trimmed = id.trim();
        String numeric = trimmed.toUpperCase().startsWith("STU-")
                ? trimmed.substring(4).replaceFirst("^0+", "")
                : trimmed;
        try {
            return studentProfileRepository.findById(Long.parseLong(numeric))
                    .orElseThrow(() -> new ResourceNotFoundException("No candidate with id " + id));
        } catch (NumberFormatException e) {
            throw new ResourceNotFoundException("Malformed candidate id: " + id);
        }
    }

    private Set<Long> shortlistedIds(String recruiterEmail) {
        if (recruiterEmail == null || recruiterEmail.isBlank()) {
            return Set.of();
        }
        return shortlistRepository.findByRecruiterEmail(recruiterEmail).stream()
                .map(Shortlist::getStudentId)
                .collect(Collectors.toSet());
    }

    private Map<String, Object> toCandidate(StudentProfile profile, Set<Long> shortlisted) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", displayId(profile.getId()));
        map.put("studentId", profile.getId());
        map.put("name", profile.getName());
        map.put("email", profile.getEmail());
        map.put("avatar", profile.getAvatar());
        map.put("college", profile.getCollege());
        map.put("department", profile.getDepartment());
        map.put("graduationYear", profile.getGraduationYear());
        map.put("cgpa", profile.getCgpa());
        map.put("aiScore", profile.getPlacementProbability());
        map.put("dsaSolved", profile.getDsaSolved());
        map.put("aptitude", profile.getAptitudeScore());
        map.put("projectsCount", profile.getProjectsCount());
        map.put("internshipsMonths", profile.getInternshipsMonths());
        map.put("backlogs", profile.getBacklogs());
        map.put("topSkills", topSkills(profile));
        map.put("roleMatch", profile.getTargetRole());
        map.put("tier", profile.getPredictedTier());
        map.put("expectedCtc", profile.getExpectedCtc());
        map.put("cohort", profile.getCohort());

        boolean isShortlisted = profile.getId() != null && shortlisted.contains(profile.getId());
        map.put("shortlisted", isShortlisted);
        map.put("status", isShortlisted ? "Shortlisted"
                : Boolean.TRUE.equals(profile.getPlaced()) ? "Placed" : "Available");

        return map;
    }

    private List<String> topSkills(StudentProfile profile) {
        List<StudentSkill> skills = new ArrayList<>(profile.getSkills());
        skills.sort((a, b) -> Integer.compare(
                b.getLevel() == null ? 0 : b.getLevel(),
                a.getLevel() == null ? 0 : a.getLevel()));
        return skills.stream()
                .limit(TOP_SKILLS_SHOWN)
                .map(StudentSkill::getName)
                .collect(Collectors.toList());
    }

    static String displayId(Long id) {
        return id == null ? null : String.format("STU-%03d", id);
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
