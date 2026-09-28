package synelix_backend.controller;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import synelix_backend.dto.PredictionRequest;
import synelix_backend.dto.PredictionResponse;
import synelix_backend.entity.PredictionRecord;
import synelix_backend.ml.MlClient;
import synelix_backend.service.PredictionService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/prediction")
public class PredictionController {

    private final PredictionService predictionService;
    private final MlClient mlClient;

    public PredictionController(PredictionService predictionService, MlClient mlClient) {
        this.predictionService = predictionService;
        this.mlClient = mlClient;
    }

    @PostMapping("/evaluate")
    public ResponseEntity<PredictionResponse> evaluate(
            Authentication authentication,
            @Valid @RequestBody PredictionRequest request) {
        request.setEmail(StudentController.subject(authentication, request.getEmail()));
        return ResponseEntity.ok(predictionService.calculatePrediction(request));
    }

    @GetMapping("/history")
    public ResponseEntity<List<PredictionRecord>> getHistory(
            Authentication authentication,
            @RequestParam(required = false) String email) {
        return ResponseEntity.ok(predictionService.getHistory(
                StudentController.subject(authentication, email)));
    }

    /** Model metadata and held-out metrics, for the "how does this work" panel. */
    @GetMapping("/model-info")
    public ResponseEntity<Map<String, Object>> modelInfo() {
        return ResponseEntity.ok(mlClient.modelInfo().orElseGet(() -> Map.of(
                "available", false,
                "message", "ML service is not reachable; predictions use the heuristic fallback."
        )));
    }
}
