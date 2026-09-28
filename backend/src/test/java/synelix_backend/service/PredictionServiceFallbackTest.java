package synelix_backend.service;

import org.junit.jupiter.api.Test;
import synelix_backend.dto.PredictionResponse;

import java.util.HashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * The heuristic fallback is what students see whenever the ML service is down,
 * so it has to behave sensibly on its own.
 */
class PredictionServiceFallbackTest {

    private final PredictionService service = new PredictionService(null, null, null);

    private static Map<String, Object> profile(double cgpa, int dsa, int aptitude,
                                               int projects, int internships,
                                               int certifications, int backlogs) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("cgpa", cgpa);
        payload.put("dsaSolved", dsa);
        payload.put("aptitudeScore", aptitude);
        payload.put("projectsCount", projects);
        payload.put("internshipsMonths", internships);
        payload.put("certificationsCount", certifications);
        payload.put("communicationScore", 75);
        payload.put("backlogs", backlogs);
        return payload;
    }

    @Test
    void labelsItselfAsFallbackRatherThanModelOutput() {
        PredictionResponse response = service.heuristic(profile(8.5, 300, 85, 4, 3, 3, 0));

        assertThat(response.getModelSource()).isEqualTo(PredictionService.SOURCE_FALLBACK);
        assertThat(response.getRecommendations()).contains("without the ML service");
    }

    @Test
    void strongerProfileScoresHigherThanWeakerOne() {
        int strong = service.heuristic(profile(9.2, 420, 94, 5, 6, 4, 0)).getProbability();
        int weak = service.heuristic(profile(6.1, 40, 48, 1, 0, 0, 0)).getProbability();

        assertThat(strong).isGreaterThan(weak);
    }

    @Test
    void backlogsReduceTheScore() {
        Map<String, Object> clean = profile(8.0, 250, 80, 3, 2, 2, 0);
        Map<String, Object> withBacklogs = profile(8.0, 250, 80, 3, 2, 2, 2);

        assertThat(service.heuristic(withBacklogs).getProbability())
                .isLessThan(service.heuristic(clean).getProbability());
    }

    @Test
    void probabilityStaysWithinItsBounds() {
        int max = service.heuristic(profile(10.0, 1000, 100, 20, 24, 20, 0)).getProbability();
        int min = service.heuristic(profile(0.0, 0, 0, 0, 0, 0, 6)).getProbability();

        assertThat(max).isBetween(5, 99);
        assertThat(min).isBetween(5, 99);
    }

    @Test
    void missingFieldsFallBackToDefaultsInsteadOfFailing() {
        PredictionResponse response = service.heuristic(new HashMap<>());

        assertThat(response.getProbability()).isNotNull();
        assertThat(response.getTier()).isNotBlank();
        assertThat(response.getFactorInsights()).isNotEmpty();
    }

    @Test
    void tierBandIsConsistentWithTheReportedProbability() {
        PredictionResponse strong = service.heuristic(profile(9.5, 450, 96, 5, 6, 4, 0));
        PredictionResponse weak = service.heuristic(profile(6.0, 30, 45, 0, 0, 0, 0));

        assertThat(strong.getMinCtc()).isGreaterThan(weak.getMinCtc());
        assertThat(strong.getExpectedCtc())
                .isBetween(strong.getMinCtc(), strong.getMaxCtc());
    }

    @Test
    void factorWeightsSumToRoughlyOne() {
        PredictionResponse response = service.heuristic(profile(8.0, 250, 80, 3, 2, 2, 0));

        double total = response.getFactorInsights().stream()
                .mapToDouble(PredictionResponse.FactorInsight::getWeightValue)
                .sum();

        assertThat(total).isCloseTo(1.0, org.assertj.core.data.Offset.offset(0.001));
    }
}
