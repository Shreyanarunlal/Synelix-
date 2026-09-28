package synelix_backend.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import synelix_backend.dto.PredictionRequest;
import synelix_backend.dto.PredictionResponse;
import synelix_backend.entity.PredictionRecord;
import synelix_backend.entity.StudentProfile;
import synelix_backend.ml.MlClient;
import synelix_backend.ml.ProfilePayload;
import synelix_backend.repository.PredictionRecordRepository;
import synelix_backend.repository.StudentProfileRepository;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Placement prediction.
 *
 * <p>The trained models in the Python service are the primary scorer. When
 * that service is unreachable this falls back to a transparent weighted
 * formula and labels the response {@code heuristic-fallback}, so a degraded
 * score is never presented as a model score.</p>
 */
@Service
public class PredictionService {

    private static final Logger log = LoggerFactory.getLogger(PredictionService.class);

    public static final String SOURCE_ML = "synelix-ml";
    public static final String SOURCE_FALLBACK = "heuristic-fallback";

    private final PredictionRecordRepository predictionRecordRepository;
    private final StudentProfileRepository studentProfileRepository;
    private final MlClient mlClient;

    public PredictionService(PredictionRecordRepository predictionRecordRepository,
                             StudentProfileRepository studentProfileRepository,
                             MlClient mlClient) {
        this.predictionRecordRepository = predictionRecordRepository;
        this.studentProfileRepository = studentProfileRepository;
        this.mlClient = mlClient;
    }

    @Transactional
    public PredictionResponse calculatePrediction(PredictionRequest request) {
        StudentProfile stored = request.getEmail() == null ? null
                : studentProfileRepository.findByEmail(request.getEmail()).orElse(null);

        Map<String, Object> payload = ProfilePayload.from(request, stored);

        PredictionResponse response = mlClient.predict(payload)
                .map(this::fromMlResponse)
                .orElseGet(() -> heuristic(payload));

        persist(request, stored, response, payload);
        return response;
    }

    /** Re-scores a stored profile and caches the result on it. */
    @Transactional
    public PredictionResponse refreshFor(StudentProfile profile) {
        Map<String, Object> payload = ProfilePayload.from(profile);
        PredictionResponse response = mlClient.predict(payload)
                .map(this::fromMlResponse)
                .orElseGet(() -> heuristic(payload));
        applyToProfile(profile, response);
        return response;
    }

    public List<PredictionRecord> getHistory(String userEmail) {
        return predictionRecordRepository.findByUserEmailOrderByCreatedAtDesc(userEmail);
    }

    // ------------------------------------------------------------------
    // ML response mapping
    // ------------------------------------------------------------------

    @SuppressWarnings("unchecked")
    private PredictionResponse fromMlResponse(Map<String, Object> body) {
        PredictionResponse response = new PredictionResponse();
        response.setProbability(asInt(body.get("probability")));
        response.setTier(asString(body.get("tier")));
        response.setTierLevel(asString(body.get("tierLevel")));
        response.setMinCtc(asDouble(body.get("minCtc")));
        response.setMaxCtc(asDouble(body.get("maxCtc")));
        response.setExpectedCtc(asDouble(body.get("expectedCtc")));
        response.setBadgeColor(asString(body.get("badgeColor")));
        response.setRecommendations(asString(body.get("recommendations")));
        response.setCohort((Map<String, Object>) body.get("cohort"));
        response.setModelSource(SOURCE_ML);

        List<PredictionResponse.FactorInsight> insights = new ArrayList<>();
        Object rawFactors = body.get("factorInsights");
        if (rawFactors instanceof List<?> list) {
            for (Object item : list) {
                if (item instanceof Map<?, ?> map) {
                    insights.add(new PredictionResponse.FactorInsight(
                            asString(map.get("factor")),
                            asString(map.get("weight")),
                            asDouble(map.get("weightValue")),
                            asInt(map.get("score")),
                            asString(map.get("status"))
                    ));
                }
            }
        }
        response.setFactorInsights(insights);

        List<PredictionResponse.WhatIfLever> levers = new ArrayList<>();
        Object rawLevers = body.get("whatIf");
        if (rawLevers instanceof List<?> list) {
            for (Object item : list) {
                if (item instanceof Map<?, ?> map) {
                    levers.add(new PredictionResponse.WhatIfLever(
                            asString(map.get("action")),
                            asString(map.get("field")),
                            asDouble(map.get("delta")),
                            asInt(map.get("newProbability")),
                            asDouble(map.get("gain"))
                    ));
                }
            }
        }
        response.setWhatIf(levers);

        return response;
    }

    // ------------------------------------------------------------------
    // Fallback scorer
    // ------------------------------------------------------------------

    /**
     * Transparent weighted scorer used when the ML service is down.
     *
     * <p>The weights approximate the permutation importances the trained
     * classifier reports, so the fallback ranks students in roughly the same
     * order even though it cannot reproduce the calibrated probability.</p>
     */
    PredictionResponse heuristic(Map<String, Object> payload) {
        double cgpa = doubleOf(payload, "cgpa", 7.5);
        int dsa = intOf(payload, "dsaSolved", 150);
        int aptitude = intOf(payload, "aptitudeScore", 70);
        int projects = intOf(payload, "projectsCount", 2);
        int internships = intOf(payload, "internshipsMonths", 0);
        int certifications = intOf(payload, "certificationsCount", 1);
        int communication = intOf(payload, "communicationScore", 70);
        int backlogs = intOf(payload, "backlogs", 0);

        double cgpaScore = pct(cgpa, 10.0);
        double dsaScore = pct(dsa, 450.0);
        double aptScore = pct(aptitude, 100.0);
        double projectScore = pct(projects, 5.0);
        double internScore = pct(internships, 6.0);
        double certScore = pct(certifications, 4.0);
        double commScore = pct(communication, 100.0);
        double standing = Math.max(0.0, 100.0 - backlogs * 20.0);

        double raw = cgpaScore * 0.26
                + dsaScore * 0.22
                + aptScore * 0.20
                + commScore * 0.13
                + projectScore * 0.12
                + internScore * 0.04
                + certScore * 0.03;

        // Backlogs gate eligibility outright at most employers, so they scale
        // the whole score rather than contributing another weighted term.
        raw *= (0.6 + 0.4 * (standing / 100.0));

        int probability = (int) Math.round(Math.min(99.0, Math.max(5.0, raw)));

        PredictionResponse response = new PredictionResponse();
        response.setProbability(probability);
        response.setModelSource(SOURCE_FALLBACK);

        Tier tier = Tier.forProbability(probability);
        response.setTier(tier.label);
        response.setTierLevel(tier.level);
        response.setMinCtc(tier.minCtc);
        response.setMaxCtc(tier.maxCtc);
        response.setExpectedCtc(Math.round((tier.minCtc + tier.maxCtc) / 2 * 100.0) / 100.0);
        response.setBadgeColor(tier.badge);

        List<PredictionResponse.FactorInsight> insights = new ArrayList<>();
        insights.add(factor("Academic CGPA", 0.26, cgpaScore,
                backlogs > 0 ? backlogs + " backlog(s) blocking eligibility" : status(cgpaScore)));
        insights.add(factor("Coding & DSA", 0.22, dsaScore, status(dsaScore)));
        insights.add(factor("Aptitude & Logic", 0.20, aptScore, status(aptScore)));
        insights.add(factor("Communication", 0.13, commScore, status(commScore)));
        insights.add(factor("Projects & Proof of Work", 0.12, projectScore, status(projectScore)));
        insights.add(factor("Internship Experience", 0.04, internScore,
                internships > 0 ? internships + " month(s) verified" : "No formal internship yet"));
        insights.add(factor("Certifications", 0.03, certScore, status(certScore)));
        response.setFactorInsights(insights);
        response.setWhatIf(List.of());

        response.setRecommendations(dsa < 400
                ? "Solve more medium-level Dynamic Programming and Graph problems to clear Tier-1 coding thresholds. "
                  + "(Scored without the ML service - start it for a calibrated probability and what-if analysis.)"
                : "Your coding volume clears most cut-offs. Focus on system design and deployment proof of work. "
                  + "(Scored without the ML service - start it for a calibrated probability and what-if analysis.)");

        return response;
    }

    private enum Tier {
        TIER1("Tier-1 Global Tech (Rs 22 - 44 LPA)", "Dream Tier-1", 22.0, 44.0,
                "bg-emerald-100 text-emerald-800 border-emerald-200", 90),
        TIER2("Product & High-Growth Unicorns (Rs 12 - 22 LPA)", "Product Tier-2", 12.0, 22.0,
                "bg-purple-100 text-purple-800 border-purple-200", 78),
        TIER3("IT Product & Fintech (Rs 7.5 - 12 LPA)", "Core Product", 7.5, 12.0,
                "bg-amber-100 text-amber-800 border-amber-200", 65),
        TIER4("Service & Core (Rs 4.5 - 7.5 LPA)", "Tier 3 / Mid-tier", 4.5, 7.5,
                "bg-blue-100 text-blue-800 border-blue-200", 0);

        final String label;
        final String level;
        final double minCtc;
        final double maxCtc;
        final String badge;
        final int threshold;

        Tier(String label, String level, double minCtc, double maxCtc, String badge, int threshold) {
            this.label = label;
            this.level = level;
            this.minCtc = minCtc;
            this.maxCtc = maxCtc;
            this.badge = badge;
            this.threshold = threshold;
        }

        static Tier forProbability(int probability) {
            for (Tier tier : values()) {
                if (probability >= tier.threshold) {
                    return tier;
                }
            }
            return TIER4;
        }
    }

    // ------------------------------------------------------------------
    // Persistence
    // ------------------------------------------------------------------

    private void persist(PredictionRequest request, StudentProfile stored,
                         PredictionResponse response, Map<String, Object> payload) {
        String email = request.getEmail() != null ? request.getEmail()
                : stored != null ? stored.getEmail() : null;
        if (email == null || email.isBlank()) {
            return;
        }

        try {
            PredictionRecord record = new PredictionRecord(
                    email,
                    doubleOf(payload, "cgpa", 0),
                    intOf(payload, "dsaSolved", 0),
                    intOf(payload, "aptitudeScore", 0),
                    intOf(payload, "projectsCount", 0),
                    intOf(payload, "internshipsMonths", 0),
                    intOf(payload, "certificationsCount", 0),
                    response.getProbability(),
                    response.getTier(),
                    response.getMinCtc(),
                    response.getMaxCtc()
            );
            record.setModelSource(response.getModelSource());
            predictionRecordRepository.save(record);

            if (stored != null) {
                applyToProfile(stored, response);
            }
        } catch (Exception e) {
            // A history write must never break the prediction the student asked for.
            log.warn("Could not persist prediction for {}: {}", email, e.getMessage());
        }
    }

    private void applyToProfile(StudentProfile profile, PredictionResponse response) {
        profile.setPlacementProbability(response.getProbability());
        profile.setPredictedTier(response.getTier());
        profile.setExpectedCtc(response.getExpectedCtc());
        profile.setLastPredictedAt(LocalDateTime.now());
        if (response.getCohort() != null) {
            profile.setCohort(asString(response.getCohort().get("name")));
        }
        studentProfileRepository.save(profile);
    }

    // ------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------

    private static PredictionResponse.FactorInsight factor(String name, double weight,
                                                           double score, String status) {
        return new PredictionResponse.FactorInsight(
                name,
                Math.round(weight * 100) + "%",
                weight,
                (int) Math.round(score),
                status
        );
    }

    private static String status(double score) {
        if (score >= 85) return "Excellent";
        if (score >= 70) return "Good";
        if (score >= 55) return "Average";
        return "Needs focus";
    }

    private static double pct(double value, double ceiling) {
        return Math.max(0.0, Math.min(100.0, (value / ceiling) * 100.0));
    }

    private static double doubleOf(Map<String, Object> map, String key, double fallback) {
        Object value = map.get(key);
        return value instanceof Number number ? number.doubleValue() : fallback;
    }

    private static int intOf(Map<String, Object> map, String key, int fallback) {
        Object value = map.get(key);
        return value instanceof Number number ? number.intValue() : fallback;
    }

    private static String asString(Object value) {
        return value == null ? null : String.valueOf(value);
    }

    private static Integer asInt(Object value) {
        return value instanceof Number number ? number.intValue() : null;
    }

    private static Double asDouble(Object value) {
        return value instanceof Number number ? number.doubleValue() : null;
    }

    Optional<StudentProfile> profileFor(String email) {
        return studentProfileRepository.findByEmail(email);
    }
}
