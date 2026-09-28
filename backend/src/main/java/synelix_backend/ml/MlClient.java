package synelix_backend.ml;

import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Talks to the Python ML service.
 *
 * <p>Every call returns an {@link Optional} rather than throwing: the ML
 * service is a separate process, and the platform is expected to keep working
 * (on the Java heuristic fallback) when it is not running. A failed call trips
 * a short circuit breaker so a dead service costs one timeout per minute
 * instead of one per request.</p>
 */
@Component
public class MlClient {

    private static final Logger log = LoggerFactory.getLogger(MlClient.class);

    /** How long to stop calling the service after a failure. */
    private static final Duration CIRCUIT_OPEN_FOR = Duration.ofSeconds(60);

    private final RestClient restClient;
    private final ObjectMapper objectMapper;
    private final boolean enabled;

    private volatile Instant circuitOpenUntil = Instant.EPOCH;

    public MlClient(@Value("${synelix.ml.base-url}") String baseUrl,
                    @Value("${synelix.ml.connect-timeout-ms}") int connectTimeoutMs,
                    @Value("${synelix.ml.read-timeout-ms}") int readTimeoutMs,
                    @Value("${synelix.ml.enabled}") boolean enabled,
                    ObjectMapper objectMapper) {

        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofMillis(connectTimeoutMs));
        factory.setReadTimeout(Duration.ofMillis(readTimeoutMs));

        this.restClient = RestClient.builder()
                .baseUrl(baseUrl)
                .requestFactory(factory)
                .build();
        this.objectMapper = objectMapper;
        this.enabled = enabled;

        log.info("ML client configured for {} (enabled={})", baseUrl, enabled);
    }

    public boolean isAvailable() {
        if (!enabled || Instant.now().isBefore(circuitOpenUntil)) {
            return false;
        }
        return get("/health", new TypeReference<Map<String, Object>>() {})
                .map(body -> Boolean.TRUE.equals(body.get("modelsLoaded")))
                .orElse(false);
    }

    public Optional<Map<String, Object>> predict(Map<String, Object> profile) {
        return post("/predict", profile, new TypeReference<>() {});
    }

    public Optional<Map<String, Object>> skillGap(Map<String, Object> profile, String targetRole) {
        return post("/skill-gap",
                Map.of("profile", profile, "targetRole", targetRole == null ? "" : targetRole),
                new TypeReference<>() {});
    }

    public Optional<List<Map<String, Object>>> matchJobs(Map<String, Object> profile, int limit) {
        return post("/match-jobs",
                Map.of("profile", profile, "limit", limit),
                new TypeReference<>() {});
    }

    public Optional<Map<String, Object>> roadmap(Map<String, Object> profile,
                                                 String targetRole,
                                                 Map<String, Boolean> completed) {
        return post("/roadmap",
                Map.of(
                        "profile", profile,
                        "targetRole", targetRole == null ? "" : targetRole,
                        "completed", completed == null ? Map.of() : completed
                ),
                new TypeReference<>() {});
    }

    public Optional<Map<String, Object>> analyseResume(String resumeText, String fileName, String targetRole) {
        return post("/resume/analyze",
                Map.of(
                        "resumeText", resumeText == null ? "" : resumeText,
                        "fileName", fileName == null ? "" : fileName,
                        "targetRole", targetRole == null ? "" : targetRole
                ),
                new TypeReference<>() {});
    }

    public Optional<Map<String, Object>> modelInfo() {
        return get("/model-info", new TypeReference<>() {});
    }

    // ------------------------------------------------------------------

    private <T> Optional<T> post(String path, Object body, TypeReference<T> type) {
        if (!enabled || Instant.now().isBefore(circuitOpenUntil)) {
            return Optional.empty();
        }
        try {
            String json = restClient.post()
                    .uri(path)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(String.class);
            return parse(json, type);
        } catch (Exception e) {
            openCircuit(path, e);
            return Optional.empty();
        }
    }

    private <T> Optional<T> get(String path, TypeReference<T> type) {
        if (!enabled || Instant.now().isBefore(circuitOpenUntil)) {
            return Optional.empty();
        }
        try {
            String json = restClient.get().uri(path).retrieve().body(String.class);
            return parse(json, type);
        } catch (Exception e) {
            openCircuit(path, e);
            return Optional.empty();
        }
    }

    private <T> Optional<T> parse(String json, TypeReference<T> type) {
        if (json == null || json.isBlank()) {
            return Optional.empty();
        }
        try {
            return Optional.ofNullable(objectMapper.readValue(json, type));
        } catch (Exception e) {
            log.warn("ML response could not be parsed: {}", e.getMessage());
            return Optional.empty();
        }
    }

    private void openCircuit(String path, Exception e) {
        circuitOpenUntil = Instant.now().plus(CIRCUIT_OPEN_FOR);
        log.warn("ML service call {} failed ({}); falling back for {}s",
                path, e.getMessage(), CIRCUIT_OPEN_FOR.toSeconds());
    }
}
