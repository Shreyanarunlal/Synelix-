package synelix_backend.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import synelix_backend.dto.ResumeAnalyzeRequest;
import synelix_backend.dto.ResumeAnalyzeResponse;
import synelix_backend.dto.SkillGapResponse;
import synelix_backend.dto.StudentProfileRequest;
import synelix_backend.entity.StudentProfile;
import synelix_backend.entity.StudentSkill;
import synelix_backend.exception.ResourceNotFoundException;
import synelix_backend.ml.MlClient;
import synelix_backend.ml.ProfilePayload;
import synelix_backend.repository.StudentProfileRepository;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@Service
public class StudentService {

    private final StudentProfileRepository studentProfileRepository;
    private final MlClient mlClient;
    private final PredictionService predictionService;

    public StudentService(StudentProfileRepository studentProfileRepository,
                          MlClient mlClient,
                          PredictionService predictionService) {
        this.studentProfileRepository = studentProfileRepository;
        this.mlClient = mlClient;
        this.predictionService = predictionService;
    }

    public StudentProfile getProfile(String email) {
        if (email == null || email.isBlank()) {
            throw new ResourceNotFoundException("A student email is required");
        }
        return studentProfileRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No student profile found for " + email));
    }

    public List<StudentProfile> getAll() {
        return studentProfileRepository.findAll();
    }

    /**
     * Creates or updates the profile, then re-scores it so the cached
     * probability the recruiter search filters on never goes stale.
     */
    @Transactional
    public StudentProfile saveProfile(StudentProfileRequest request) {
        StudentProfile profile = studentProfileRepository.findByEmail(request.getEmail())
                .orElseGet(StudentProfile::new);

        profile.setEmail(request.getEmail());
        if (request.getName() != null) profile.setName(request.getName());
        if (request.getPhone() != null) profile.setPhone(request.getPhone());
        if (request.getRollNumber() != null) profile.setRollNumber(request.getRollNumber());
        if (request.getCollege() != null) profile.setCollege(request.getCollege());
        if (request.getDepartment() != null) profile.setDepartment(request.getDepartment());
        if (request.getGraduationYear() != null) profile.setGraduationYear(request.getGraduationYear());
        if (request.getCgpa() != null) profile.setCgpa(request.getCgpa());
        if (request.getDsaSolved() != null) profile.setDsaSolved(request.getDsaSolved());
        if (request.getAptitudeScore() != null) profile.setAptitudeScore(request.getAptitudeScore());
        if (request.getProjectsCount() != null) profile.setProjectsCount(request.getProjectsCount());
        if (request.getInternshipsMonths() != null) profile.setInternshipsMonths(request.getInternshipsMonths());
        if (request.getCertificationsCount() != null) profile.setCertificationsCount(request.getCertificationsCount());
        if (request.getHackathonsWon() != null) profile.setHackathonsWon(request.getHackathonsWon());
        if (request.getCommunicationScore() != null) profile.setCommunicationScore(request.getCommunicationScore());
        if (request.getBacklogs() != null) profile.setBacklogs(request.getBacklogs());
        if (request.getTargetRole() != null) profile.setTargetRole(request.getTargetRole());

        if (request.getSkills() != null) {
            profile.getSkills().clear();
            for (StudentProfileRequest.SkillInput skill : request.getSkills()) {
                profile.addSkill(new StudentSkill(
                        skill.getName(), skill.getLevel(), skill.getCategory()));
            }
        }

        StudentProfile saved = studentProfileRepository.save(profile);
        predictionService.refreshFor(saved);
        return saved;
    }

    // ------------------------------------------------------------------
    // Skill gap
    // ------------------------------------------------------------------

    public SkillGapResponse getSkillGap(String email, String targetRole) {
        StudentProfile profile = getProfile(email);
        String role = targetRole != null && !targetRole.isBlank()
                ? targetRole : profile.getTargetRole();

        return mlClient.skillGap(ProfilePayload.from(profile), role)
                .map(SkillGapResponse::fromMl)
                .orElseGet(() -> fallbackSkillGap(profile, role));
    }

    /**
     * Evidence-based fallback used when the ML service is down.
     *
     * <p>Scores each benchmark from the same profile signals the Python side
     * uses, so the numbers stay in the same ballpark rather than reverting to
     * a fixed table.</p>
     */
    private SkillGapResponse fallbackSkillGap(StudentProfile profile, String role) {
        String resolved = role == null || role.isBlank() ? "Full Stack Developer" : role;

        double dsa = pct(profile.getDsaSolved(), 450);
        double apt = pct(profile.getAptitudeScore(), 100);
        double cgpa = pct(profile.getCgpa(), 10.0);
        double projects = pct(profile.getProjectsCount(), 5);
        double interns = pct(profile.getInternshipsMonths(), 6);
        double certs = pct(profile.getCertificationsCount(), 4);

        List<SkillGapResponse.SkillMetric> benchmarks = new ArrayList<>();
        benchmarks.add(metric("Frontend (React/Vue)", 85, blend(projects, 0.6, certs, 0.4)));
        benchmarks.add(metric("Backend (Node/Spring)", 85, blend(projects, 0.6, interns, 0.4)));
        benchmarks.add(metric("DSA & Problem Solving", 80, dsa));
        benchmarks.add(metric("Database & SQL", 80, blend(projects, 0.5, cgpa, 0.5)));
        benchmarks.add(metric("System Design", 75, blend(interns, 0.6, projects, 0.4)));
        benchmarks.add(metric("DevOps & Cloud", 70, blend(certs, 0.7, projects, 0.3)));
        benchmarks.add(metric("Aptitude & Reasoning", 75, apt));

        List<SkillGapResponse.DeficitItem> deficits = new ArrayList<>();
        for (SkillGapResponse.SkillMetric benchmark : benchmarks) {
            int gap = benchmark.getStudentCurrent() - benchmark.getRequired();
            if (gap < 0) {
                deficits.add(new SkillGapResponse.DeficitItem(
                        benchmark.getSkill(), gap, priority(Math.abs(gap)),
                        "Close the " + Math.abs(gap) + " point gap in "
                                + benchmark.getSkill() + " before applying."));
            }
        }
        deficits.sort((a, b) -> Integer.compare(a.getGap(), b.getGap()));

        SkillGapResponse response = new SkillGapResponse(resolved, benchmarks, deficits);
        response.setModelSource(PredictionService.SOURCE_FALLBACK);
        response.setSummary("Scored without the ML service. Start it for the full "
                + "role benchmark set and ranked remediation plan.");
        return response;
    }

    // ------------------------------------------------------------------
    // Resume
    // ------------------------------------------------------------------

    public ResumeAnalyzeResponse analyzeResume(String email, ResumeAnalyzeRequest request) {
        String text = request == null ? null : request.getResumeText();
        String fileName = request == null ? null : request.getFileName();

        String targetRole = null;
        if (email != null && !email.isBlank()) {
            targetRole = studentProfileRepository.findByEmail(email)
                    .map(StudentProfile::getTargetRole).orElse(null);
        }
        if (request != null && request.getTargetRole() != null) {
            targetRole = request.getTargetRole();
        }

        final String role = targetRole;
        return mlClient.analyseResume(text, fileName, role)
                .map(ResumeAnalyzeResponse::fromMl)
                .orElseGet(() -> fallbackResume(text, fileName));
    }

    /** Keyword-coverage scorer used when the ML service is unreachable. */
    private ResumeAnalyzeResponse fallbackResume(String resumeText, String fileName) {
        ResumeAnalyzeResponse response = new ResumeAnalyzeResponse();
        response.setFileName(fileName);
        response.setModelSource(PredictionService.SOURCE_FALLBACK);

        if (resumeText == null || resumeText.isBlank()) {
            // Saying "no input, no score" beats inventing a number.
            response.setAnalysed(false);
            response.setMessage("No resume text was supplied, so no score was produced. "
                    + "Paste or upload the resume content to run the analysis.");
            response.setSkillsFound(List.of());
            response.setMissingKeywords(List.of());
            response.setRecommendations(List.of(
                    "Upload the resume file or paste its text to run the ATS scan."));
            return response;
        }

        String lowered = resumeText.toLowerCase(Locale.ROOT);
        List<String> vocabulary = Arrays.asList(
                "java", "python", "javascript", "react", "node", "spring boot", "rest api",
                "sql", "postgresql", "mongodb", "docker", "git", "microservices", "ci/cd",
                "unit testing", "agile", "kubernetes", "aws");

        Set<String> found = new LinkedHashSet<>();
        List<String> missing = new ArrayList<>();
        for (String keyword : vocabulary) {
            if (lowered.contains(keyword)) {
                found.add(titleCase(keyword));
            } else {
                missing.add(titleCase(keyword));
            }
        }

        int keywordScore = (int) Math.round(100.0 * found.size() / vocabulary.size());
        int wordCount = resumeText.split("\\s+").length;
        int formatScore = wordCount >= 250 && wordCount <= 900 ? 90
                : wordCount < 250 ? Math.max(30, wordCount * 90 / 250) : 70;
        int impactScore = Math.min(100, countMatches(lowered) * 12);
        int overall = (int) Math.round(0.45 * keywordScore + 0.25 * formatScore + 0.30 * impactScore);

        response.setAnalysed(true);
        response.setOverallScore(overall);
        response.setFormatScore(formatScore);
        response.setKeywordScore(keywordScore);
        response.setImpactScore(impactScore);
        response.setSkillsFound(new ArrayList<>(found));
        response.setMissingKeywords(missing.subList(0, Math.min(10, missing.size())));
        response.setWordCount(wordCount);

        List<String> tips = new ArrayList<>();
        if (!missing.isEmpty()) {
            tips.add("Add the missing keywords an ATS filters on: "
                    + String.join(", ", missing.subList(0, Math.min(5, missing.size()))) + ".");
        }
        if (impactScore < 60) {
            tips.add("Quantify achievements - name the number (for example, cut latency by 35%).");
        }
        tips.add("Scored without the ML service. Start it for the full role-aware analysis.");
        response.setRecommendations(tips);

        return response;
    }

    private static int countMatches(String text) {
        // Rough proxy for quantified impact: digit runs and percentages.
        int count = 0;
        java.util.regex.Matcher matcher =
                java.util.regex.Pattern.compile("\\d+(\\.\\d+)?\\s*(%|x|ms|k|\\+)?").matcher(text);
        while (matcher.find()) {
            count++;
        }
        return count;
    }

    private static SkillGapResponse.SkillMetric metric(String skill, int required, double current) {
        return new SkillGapResponse.SkillMetric(skill, required, (int) Math.round(current));
    }

    private static double blend(double a, double wa, double b, double wb) {
        return (a * wa + b * wb) / (wa + wb);
    }

    private static String priority(int gapSize) {
        if (gapSize >= 15) return "High Priority";
        if (gapSize >= 7) return "Medium Priority";
        return "Low Priority";
    }

    private static double pct(Number value, double ceiling) {
        if (value == null || ceiling <= 0) {
            return 0.0;
        }
        return Math.max(0.0, Math.min(100.0, value.doubleValue() / ceiling * 100.0));
    }

    private static String titleCase(String keyword) {
        return switch (keyword) {
            case "sql" -> "SQL";
            case "rest api" -> "REST APIs";
            case "ci/cd" -> "CI/CD";
            case "aws" -> "AWS";
            default -> Character.toUpperCase(keyword.charAt(0)) + keyword.substring(1);
        };
    }

    Map<String, Object> payloadFor(StudentProfile profile) {
        return ProfilePayload.from(profile);
    }
}
