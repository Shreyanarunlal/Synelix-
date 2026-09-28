package synelix_backend.service;

import org.springframework.stereotype.Service;
import synelix_backend.dto.CopilotChatRequest;
import synelix_backend.dto.CopilotChatResponse;
import synelix_backend.dto.PredictionResponse;
import synelix_backend.dto.SkillGapResponse;
import synelix_backend.entity.StudentProfile;
import synelix_backend.repository.StudentProfileRepository;

import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.StringJoiner;

/**
 * Synelix Copilot.
 *
 * <p>This is an intent-routed assistant grounded in the student's stored
 * record and model output - not a language model. It answers by retrieving
 * the student's real numbers and the model's real explanations, so the advice
 * it gives is specific to whoever is asking. The {@code source} field says so
 * explicitly rather than implying a generative model is behind it.</p>
 */
@Service
public class CopilotService {

    private static final String SOURCE = "Synelix rule-based copilot (grounded in your profile)";

    private final StudentProfileRepository studentProfileRepository;
    private final PredictionService predictionService;
    private final StudentService studentService;

    public CopilotService(StudentProfileRepository studentProfileRepository,
                          PredictionService predictionService,
                          StudentService studentService) {
        this.studentProfileRepository = studentProfileRepository;
        this.predictionService = predictionService;
        this.studentService = studentService;
    }

    public CopilotChatResponse processQuery(String email, CopilotChatRequest request) {
        String query = request == null || request.getQuery() == null
                ? "" : request.getQuery().toLowerCase(Locale.ROOT);

        Optional<StudentProfile> profile = email == null ? Optional.empty()
                : studentProfileRepository.findByEmail(email);

        if (profile.isEmpty()) {
            return new CopilotChatResponse(
                    "I could not find a student profile for this account, so I have nothing "
                            + "specific to work from yet. Complete your profile and I can answer "
                            + "using your own numbers.",
                    SOURCE);
        }

        StudentProfile student = profile.get();
        Intent intent = Intent.of(query);

        String reply = switch (intent) {
            case IMPROVE_SCORE -> improveScore(student);
            case SKILL_GAP -> skillGap(student);
            case COMPANY_PREP -> companyPrep(student, query);
            case RESUME -> resume();
            case STATUS -> status(student);
            case UNKNOWN -> unknown(student, request);
        };

        return new CopilotChatResponse(reply, SOURCE);
    }

    private enum Intent {
        IMPROVE_SCORE, SKILL_GAP, COMPANY_PREP, RESUME, STATUS, UNKNOWN;

        static Intent of(String query) {
            if (containsAny(query, "improve", "boost", "raise", "increase", "better", "how do i get")) {
                return IMPROVE_SCORE;
            }
            if (containsAny(query, "skill gap", "gap", "weak", "missing skill", "what should i learn")) {
                return SKILL_GAP;
            }
            if (containsAny(query, "amazon", "google", "microsoft", "company", "dsa", "interview", "prepare")) {
                return COMPANY_PREP;
            }
            if (containsAny(query, "resume", "cv", "ats", "bullet")) {
                return RESUME;
            }
            if (containsAny(query, "my score", "probability", "chance", "where do i stand", "readiness")) {
                return STATUS;
            }
            return UNKNOWN;
        }

        private static boolean containsAny(String haystack, String... needles) {
            for (String needle : needles) {
                if (haystack.contains(needle)) {
                    return true;
                }
            }
            return false;
        }
    }

    // ------------------------------------------------------------------

    private String improveScore(StudentProfile student) {
        PredictionResponse prediction = predictionService.refreshFor(student);
        StringBuilder reply = new StringBuilder();

        reply.append("### Raising your placement probability\n\n");
        reply.append(String.format("You are at **%d%%** right now, predicted band **%s**.%n%n",
                prediction.getProbability(), prediction.getTierLevel()));

        List<PredictionResponse.WhatIfLever> levers = prediction.getWhatIf();
        if (levers != null && !levers.isEmpty()) {
            reply.append("Ranked by what the model says each change is worth:\n\n");
            int rank = 1;
            for (PredictionResponse.WhatIfLever lever : levers) {
                if (rank > 4) {
                    break;
                }
                reply.append(String.format("%d. **%s** takes you to %d%% (%+.1f points)%n",
                        rank++, lever.getAction(), lever.getNewProbability(), lever.getGain()));
            }
            reply.append('\n');
        }

        reply.append(prediction.getRecommendations());
        return reply.toString();
    }

    private String skillGap(StudentProfile student) {
        SkillGapResponse gap = studentService.getSkillGap(student.getEmail(), student.getTargetRole());

        StringBuilder reply = new StringBuilder();
        reply.append(String.format("### Skill gaps for %s%n%n", gap.getTargetRole()));
        if (gap.getRoleReadiness() != null) {
            reply.append(String.format("You currently meet **%d%%** of this role's benchmark.%n%n",
                    gap.getRoleReadiness()));
        }

        if (gap.getDeficits() == null || gap.getDeficits().isEmpty()) {
            reply.append("You clear every benchmark for this role. Shift your time to mock "
                    + "interviews and company-specific preparation.");
            return reply.toString();
        }

        for (SkillGapResponse.DeficitItem deficit : gap.getDeficits()) {
            reply.append(String.format("- **%s** - %d points below the bar (%s)%n  %s%n",
                    deficit.getSkill(), Math.abs(deficit.getGap()),
                    deficit.getPriority(), deficit.getRecommendation()));
        }

        if (gap.getStrengths() != null && !gap.getStrengths().isEmpty()) {
            reply.append("\n**Already at or above the bar:** ")
                    .append(String.join(", ", gap.getStrengths()));
        }
        return reply.toString();
    }

    private String companyPrep(StudentProfile student, String query) {
        int dsa = student.getDsaSolved() == null ? 0 : student.getDsaSolved();

        StringBuilder reply = new StringBuilder();
        reply.append("### Company preparation\n\n");
        reply.append(String.format("Your solved count is **%d**. ", dsa));

        if (query.contains("amazon")) {
            reply.append("Amazon weights trees and BFS, heaps and priority queues, and "
                    + "two-pointer or sliding-window problems, alongside the Leadership "
                    + "Principles. Their published cut-off is 280 solved problems.\n\n");
            reply.append(gapLine(dsa, 280));
        } else if (query.contains("google")) {
            reply.append("Google weights graph traversal (Dijkstra, topological sort), "
                    + "dynamic programming, and clean modular code with explicit edge-case "
                    + "handling. Their published cut-off is 300 solved problems.\n\n");
            reply.append(gapLine(dsa, 300));
        } else if (query.contains("microsoft")) {
            reply.append("Microsoft weights string manipulation, HashMap and Trie problems, "
                    + "and low-level design. Their published cut-off is 280 solved problems.\n\n");
            reply.append(gapLine(dsa, 280));
        } else {
            reply.append("Tier-1 product companies generally expect 280 to 300 solved problems "
                    + "with depth in graphs, dynamic programming and low-level design.\n\n");
            reply.append(gapLine(dsa, 300));
        }

        reply.append("\n\nRun the company matching panel on your dashboard for the full "
                + "eligibility breakdown against every indexed employer.");
        return reply.toString();
    }

    private String gapLine(int solved, int required) {
        if (solved >= required) {
            return String.format("You are **%d above** that cut-off - the gating factor is now "
                    + "depth and interview conversion, not volume.", solved - required);
        }
        return String.format("You are **%d short** of that cut-off. At 5 problems a day that is "
                + "about %d days of work.", required - solved,
                (int) Math.ceil((required - solved) / 5.0));
    }

    private String resume() {
        return """
                ### High-impact resume bullets (XYZ formula)

                Structure every bullet as *accomplished **X**, measured by **Y**, by doing **Z***.

                **Before:** Built a distributed backend for task processing using Java and Redis.

                **After:** Architected a high-throughput asynchronous task queue in **Java 21**,
                **Spring Boot** and **Redis**, processing **10,000+ concurrent jobs** at
                **99.95% uptime** and cutting task latency **35%**.

                The difference is the numbers. Run your resume through the ATS analyser on your
                dashboard for a scored breakdown of keyword coverage, structure and impact.""";
    }

    private String status(StudentProfile student) {
        PredictionResponse prediction = predictionService.refreshFor(student);

        StringBuilder reply = new StringBuilder();
        reply.append("### Where you stand\n\n");
        reply.append(String.format("- **Placement probability:** %d%%%n", prediction.getProbability()));
        reply.append(String.format("- **Predicted band:** %s%n", prediction.getTier()));
        if (prediction.getExpectedCtc() != null) {
            reply.append(String.format("- **Expected offer:** around Rs %.1f LPA%n",
                    prediction.getExpectedCtc()));
        }
        if (prediction.getCohort() != null && prediction.getCohort().get("name") != null) {
            reply.append(String.format("- **Your cohort:** %s%n", prediction.getCohort().get("name")));
        }
        reply.append('\n');

        if (prediction.getFactorInsights() != null) {
            reply.append("**Factor breakdown** (weights learned by the model):\n\n");
            for (PredictionResponse.FactorInsight insight : prediction.getFactorInsights()) {
                reply.append(String.format("- %s - %d/100, weight %s (%s)%n",
                        insight.getFactor(), insight.getScore(),
                        insight.getWeight(), insight.getStatus()));
            }
        }
        return reply.toString();
    }

    private String unknown(StudentProfile student, CopilotChatRequest request) {
        String asked = request == null || request.getQuery() == null ? "" : request.getQuery();

        StringJoiner profileLine = new StringJoiner(", ");
        if (student.getCgpa() != null) profileLine.add("CGPA " + student.getCgpa());
        if (student.getDsaSolved() != null) profileLine.add(student.getDsaSolved() + " problems solved");
        if (student.getAptitudeScore() != null) profileLine.add("aptitude " + student.getAptitudeScore());

        return String.format("""
                I do not have a specific answer for "%s".

                I am a rule-based assistant, so I answer from your stored record rather than
                generating free-form text. Here is what I can work with today: %s.

                Try asking about:
                - how to improve your placement probability
                - your skill gaps for a target role
                - preparation for a specific company
                - your resume and ATS score
                - where you currently stand""",
                asked, profileLine.length() == 0 ? "an incomplete profile" : profileLine);
    }
}
