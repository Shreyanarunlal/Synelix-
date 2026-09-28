package synelix_backend.dto;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class SkillGapResponse {

    private String targetRole;
    private List<SkillMetric> benchmarks;
    private List<DeficitItem> deficits;
    private List<String> strengths;
    private Integer roleReadiness;
    private String summary;
    private String modelSource;

    public SkillGapResponse() {
    }

    public SkillGapResponse(String targetRole, List<SkillMetric> benchmarks, List<DeficitItem> deficits) {
        this.targetRole = targetRole;
        this.benchmarks = benchmarks;
        this.deficits = deficits;
    }

    /** Maps the ML service's JSON onto this DTO. */
    @SuppressWarnings("unchecked")
    public static SkillGapResponse fromMl(Map<String, Object> body) {
        SkillGapResponse response = new SkillGapResponse();
        response.setTargetRole(str(body.get("targetRole")));
        response.setSummary(str(body.get("summary")));
        response.setModelSource("synelix-ml");

        Object readiness = body.get("roleReadiness");
        if (readiness instanceof Number number) {
            response.setRoleReadiness(number.intValue());
        }

        List<SkillMetric> benchmarks = new ArrayList<>();
        if (body.get("benchmarks") instanceof List<?> list) {
            for (Object item : list) {
                if (item instanceof Map<?, ?> map) {
                    benchmarks.add(new SkillMetric(
                            str(map.get("skill")),
                            intOf(map.get("required")),
                            intOf(map.get("studentCurrent"))
                    ));
                }
            }
        }
        response.setBenchmarks(benchmarks);

        List<DeficitItem> deficits = new ArrayList<>();
        if (body.get("deficits") instanceof List<?> list) {
            for (Object item : list) {
                if (item instanceof Map<?, ?> map) {
                    deficits.add(new DeficitItem(
                            str(map.get("skill")),
                            intOf(map.get("gap")),
                            str(map.get("priority")),
                            str(map.get("recommendation"))
                    ));
                }
            }
        }
        response.setDeficits(deficits);

        if (body.get("strengths") instanceof List<?> list) {
            List<String> strengths = new ArrayList<>();
            for (Object item : list) {
                strengths.add(String.valueOf(item));
            }
            response.setStrengths(strengths);
        }

        return response;
    }

    private static String str(Object value) {
        return value == null ? null : String.valueOf(value);
    }

    private static Integer intOf(Object value) {
        return value instanceof Number number ? number.intValue() : null;
    }

    public static class SkillMetric {
        private String skill;
        private Integer required;
        private Integer studentCurrent;

        public SkillMetric() {
        }

        public SkillMetric(String skill, Integer required, Integer studentCurrent) {
            this.skill = skill;
            this.required = required;
            this.studentCurrent = studentCurrent;
        }

        public String getSkill() {
            return skill;
        }

        public void setSkill(String skill) {
            this.skill = skill;
        }

        public Integer getRequired() {
            return required;
        }

        public void setRequired(Integer required) {
            this.required = required;
        }

        public Integer getStudentCurrent() {
            return studentCurrent;
        }

        public void setStudentCurrent(Integer studentCurrent) {
            this.studentCurrent = studentCurrent;
        }
    }

    public static class DeficitItem {
        private String skill;
        private Integer gap;
        private String priority;
        private String recommendation;

        public DeficitItem() {
        }

        public DeficitItem(String skill, Integer gap, String priority, String recommendation) {
            this.skill = skill;
            this.gap = gap;
            this.priority = priority;
            this.recommendation = recommendation;
        }

        public String getSkill() {
            return skill;
        }

        public void setSkill(String skill) {
            this.skill = skill;
        }

        public Integer getGap() {
            return gap;
        }

        public void setGap(Integer gap) {
            this.gap = gap;
        }

        public String getPriority() {
            return priority;
        }

        public void setPriority(String priority) {
            this.priority = priority;
        }

        public String getRecommendation() {
            return recommendation;
        }

        public void setRecommendation(String recommendation) {
            this.recommendation = recommendation;
        }
    }

    public String getTargetRole() {
        return targetRole;
    }

    public void setTargetRole(String targetRole) {
        this.targetRole = targetRole;
    }

    public List<SkillMetric> getBenchmarks() {
        return benchmarks;
    }

    public void setBenchmarks(List<SkillMetric> benchmarks) {
        this.benchmarks = benchmarks;
    }

    public List<DeficitItem> getDeficits() {
        return deficits;
    }

    public void setDeficits(List<DeficitItem> deficits) {
        this.deficits = deficits;
    }

    public List<String> getStrengths() {
        return strengths;
    }

    public void setStrengths(List<String> strengths) {
        this.strengths = strengths;
    }

    public Integer getRoleReadiness() {
        return roleReadiness;
    }

    public void setRoleReadiness(Integer roleReadiness) {
        this.roleReadiness = roleReadiness;
    }

    public String getSummary() {
        return summary;
    }

    public void setSummary(String summary) {
        this.summary = summary;
    }

    public String getModelSource() {
        return modelSource;
    }

    public void setModelSource(String modelSource) {
        this.modelSource = modelSource;
    }
}
