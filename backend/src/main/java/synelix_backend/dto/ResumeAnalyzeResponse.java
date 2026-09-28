package synelix_backend.dto;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class ResumeAnalyzeResponse {

    /** False when no resume text was supplied, in which case the scores are null. */
    private boolean analysed;
    private String message;
    private String fileName;
    private String targetRole;

    private Integer overallScore;
    private Integer formatScore;
    private Integer keywordScore;
    private Integer impactScore;
    private Integer wordCount;

    private List<String> skillsFound;
    private List<String> missingKeywords;
    private List<String> recommendations;

    private String modelSource;

    public ResumeAnalyzeResponse() {
    }

    public ResumeAnalyzeResponse(Integer overallScore, Integer formatScore, Integer keywordScore,
                                 Integer impactScore, List<String> skillsFound,
                                 List<String> missingKeywords, List<String> recommendations) {
        this.analysed = true;
        this.overallScore = overallScore;
        this.formatScore = formatScore;
        this.keywordScore = keywordScore;
        this.impactScore = impactScore;
        this.skillsFound = skillsFound;
        this.missingKeywords = missingKeywords;
        this.recommendations = recommendations;
    }

    public static ResumeAnalyzeResponse fromMl(Map<String, Object> body) {
        ResumeAnalyzeResponse response = new ResumeAnalyzeResponse();
        response.setAnalysed(Boolean.TRUE.equals(body.get("analysed")));
        response.setMessage(str(body.get("message")));
        response.setFileName(str(body.get("fileName")));
        response.setTargetRole(str(body.get("targetRole")));
        response.setOverallScore(intOf(body.get("overallScore")));
        response.setFormatScore(intOf(body.get("formatScore")));
        response.setKeywordScore(intOf(body.get("keywordScore")));
        response.setImpactScore(intOf(body.get("impactScore")));
        response.setWordCount(intOf(body.get("wordCount")));
        response.setSkillsFound(strings(body.get("skillsFound")));
        response.setMissingKeywords(strings(body.get("missingKeywords")));
        response.setRecommendations(strings(body.get("recommendations")));
        response.setModelSource("synelix-ml");
        return response;
    }

    private static String str(Object value) {
        return value == null ? null : String.valueOf(value);
    }

    private static Integer intOf(Object value) {
        return value instanceof Number number ? number.intValue() : null;
    }

    private static List<String> strings(Object value) {
        List<String> result = new ArrayList<>();
        if (value instanceof List<?> list) {
            for (Object item : list) {
                result.add(String.valueOf(item));
            }
        }
        return result;
    }

    public boolean isAnalysed() {
        return analysed;
    }

    public void setAnalysed(boolean analysed) {
        this.analysed = analysed;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public String getTargetRole() {
        return targetRole;
    }

    public void setTargetRole(String targetRole) {
        this.targetRole = targetRole;
    }

    public Integer getOverallScore() {
        return overallScore;
    }

    public void setOverallScore(Integer overallScore) {
        this.overallScore = overallScore;
    }

    public Integer getFormatScore() {
        return formatScore;
    }

    public void setFormatScore(Integer formatScore) {
        this.formatScore = formatScore;
    }

    public Integer getKeywordScore() {
        return keywordScore;
    }

    public void setKeywordScore(Integer keywordScore) {
        this.keywordScore = keywordScore;
    }

    public Integer getImpactScore() {
        return impactScore;
    }

    public void setImpactScore(Integer impactScore) {
        this.impactScore = impactScore;
    }

    public Integer getWordCount() {
        return wordCount;
    }

    public void setWordCount(Integer wordCount) {
        this.wordCount = wordCount;
    }

    public List<String> getSkillsFound() {
        return skillsFound;
    }

    public void setSkillsFound(List<String> skillsFound) {
        this.skillsFound = skillsFound;
    }

    public List<String> getMissingKeywords() {
        return missingKeywords;
    }

    public void setMissingKeywords(List<String> missingKeywords) {
        this.missingKeywords = missingKeywords;
    }

    public List<String> getRecommendations() {
        return recommendations;
    }

    public void setRecommendations(List<String> recommendations) {
        this.recommendations = recommendations;
    }

    public String getModelSource() {
        return modelSource;
    }

    public void setModelSource(String modelSource) {
        this.modelSource = modelSource;
    }
}
