package synelix_backend.dto;

import java.util.List;
import java.util.Map;

public class PredictionResponse {

    private Integer probability;
    private String tier;
    private String tierLevel;
    private Double minCtc;
    private Double maxCtc;
    private Double expectedCtc;
    private String badgeColor;
    private List<FactorInsight> factorInsights;
    private List<WhatIfLever> whatIf;
    private Map<String, Object> cohort;
    private String recommendations;

    /**
     * "synelix-ml" when the trained models produced this, "heuristic-fallback"
     * when the ML service was unreachable. Surfaced so nobody mistakes a
     * fallback score for a model score.
     */
    private String modelSource;

    public PredictionResponse() {
    }

    public static class FactorInsight {
        private String factor;
        private String weight;
        private Double weightValue;
        private Integer score;
        private String status;

        public FactorInsight() {
        }

        public FactorInsight(String factor, String weight, Double weightValue, Integer score, String status) {
            this.factor = factor;
            this.weight = weight;
            this.weightValue = weightValue;
            this.score = score;
            this.status = status;
        }

        public String getFactor() {
            return factor;
        }

        public void setFactor(String factor) {
            this.factor = factor;
        }

        public String getWeight() {
            return weight;
        }

        public void setWeight(String weight) {
            this.weight = weight;
        }

        public Double getWeightValue() {
            return weightValue;
        }

        public void setWeightValue(Double weightValue) {
            this.weightValue = weightValue;
        }

        public Integer getScore() {
            return score;
        }

        public void setScore(Integer score) {
            this.score = score;
        }

        public String getStatus() {
            return status;
        }

        public void setStatus(String status) {
            this.status = status;
        }
    }

    /** One counterfactual: what this single change does to the probability. */
    public static class WhatIfLever {
        private String action;
        private String field;
        private Double delta;
        private Integer newProbability;
        private Double gain;

        public WhatIfLever() {
        }

        public WhatIfLever(String action, String field, Double delta, Integer newProbability, Double gain) {
            this.action = action;
            this.field = field;
            this.delta = delta;
            this.newProbability = newProbability;
            this.gain = gain;
        }

        public String getAction() {
            return action;
        }

        public void setAction(String action) {
            this.action = action;
        }

        public String getField() {
            return field;
        }

        public void setField(String field) {
            this.field = field;
        }

        public Double getDelta() {
            return delta;
        }

        public void setDelta(Double delta) {
            this.delta = delta;
        }

        public Integer getNewProbability() {
            return newProbability;
        }

        public void setNewProbability(Integer newProbability) {
            this.newProbability = newProbability;
        }

        public Double getGain() {
            return gain;
        }

        public void setGain(Double gain) {
            this.gain = gain;
        }
    }

    public Integer getProbability() {
        return probability;
    }

    public void setProbability(Integer probability) {
        this.probability = probability;
    }

    public String getTier() {
        return tier;
    }

    public void setTier(String tier) {
        this.tier = tier;
    }

    public String getTierLevel() {
        return tierLevel;
    }

    public void setTierLevel(String tierLevel) {
        this.tierLevel = tierLevel;
    }

    public Double getMinCtc() {
        return minCtc;
    }

    public void setMinCtc(Double minCtc) {
        this.minCtc = minCtc;
    }

    public Double getMaxCtc() {
        return maxCtc;
    }

    public void setMaxCtc(Double maxCtc) {
        this.maxCtc = maxCtc;
    }

    public Double getExpectedCtc() {
        return expectedCtc;
    }

    public void setExpectedCtc(Double expectedCtc) {
        this.expectedCtc = expectedCtc;
    }

    public String getBadgeColor() {
        return badgeColor;
    }

    public void setBadgeColor(String badgeColor) {
        this.badgeColor = badgeColor;
    }

    public List<FactorInsight> getFactorInsights() {
        return factorInsights;
    }

    public void setFactorInsights(List<FactorInsight> factorInsights) {
        this.factorInsights = factorInsights;
    }

    public List<WhatIfLever> getWhatIf() {
        return whatIf;
    }

    public void setWhatIf(List<WhatIfLever> whatIf) {
        this.whatIf = whatIf;
    }

    public Map<String, Object> getCohort() {
        return cohort;
    }

    public void setCohort(Map<String, Object> cohort) {
        this.cohort = cohort;
    }

    public String getRecommendations() {
        return recommendations;
    }

    public void setRecommendations(String recommendations) {
        this.recommendations = recommendations;
    }

    public String getModelSource() {
        return modelSource;
    }

    public void setModelSource(String modelSource) {
        this.modelSource = modelSource;
    }
}
