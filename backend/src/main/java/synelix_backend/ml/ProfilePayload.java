package synelix_backend.ml;

import synelix_backend.dto.PredictionRequest;
import synelix_backend.entity.StudentProfile;
import synelix_backend.entity.StudentSkill;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Builds the JSON body the ML service expects from the domain objects.
 *
 * <p>Nulls are dropped rather than sent, because the Python side has
 * documented defaults for absent fields and sending an explicit null would
 * override them with nothing.</p>
 */
public final class ProfilePayload {

    private ProfilePayload() {
    }

    public static Map<String, Object> from(StudentProfile profile) {
        Map<String, Object> payload = new HashMap<>();
        if (profile == null) {
            return payload;
        }

        put(payload, "email", profile.getEmail());
        put(payload, "name", profile.getName());
        put(payload, "department", profile.getDepartment());
        put(payload, "targetRole", profile.getTargetRole());
        put(payload, "cgpa", profile.getCgpa());
        put(payload, "dsaSolved", profile.getDsaSolved());
        put(payload, "aptitudeScore", profile.getAptitudeScore());
        put(payload, "projectsCount", profile.getProjectsCount());
        put(payload, "internshipsMonths", profile.getInternshipsMonths());
        put(payload, "certificationsCount", profile.getCertificationsCount());
        put(payload, "hackathonsWon", profile.getHackathonsWon());
        put(payload, "communicationScore", profile.getCommunicationScore());
        put(payload, "backlogs", profile.getBacklogs());

        List<Map<String, Object>> skills = new ArrayList<>();
        for (StudentSkill skill : profile.getSkills()) {
            Map<String, Object> entry = new HashMap<>();
            entry.put("name", skill.getName());
            put(entry, "level", skill.getLevel());
            put(entry, "category", skill.getCategory());
            skills.add(entry);
        }
        payload.put("skills", skills);

        return payload;
    }

    /**
     * Payload for an ad-hoc prediction, where the request overrides whatever
     * the stored profile holds. This is what powers the interactive
     * "what happens if I solve 50 more problems" slider in the dashboard.
     */
    public static Map<String, Object> from(PredictionRequest request, StudentProfile stored) {
        Map<String, Object> payload = from(stored);
        if (request == null) {
            return payload;
        }

        put(payload, "cgpa", request.getCgpa());
        put(payload, "dsaSolved", request.getDsaSolved());
        put(payload, "aptitudeScore", request.getAptitudeScore());
        put(payload, "projectsCount", request.getProjectsCount());
        put(payload, "internshipsMonths", request.getInternshipsMonths());
        put(payload, "certificationsCount", request.getCertificationsCount());
        put(payload, "hackathonsWon", request.getHackathonsWon());
        put(payload, "communicationScore", request.getCommunicationScore());
        put(payload, "backlogs", request.getBacklogs());
        put(payload, "department", request.getDepartment());
        put(payload, "targetRole", request.getTargetRole());

        return payload;
    }

    private static void put(Map<String, Object> map, String key, Object value) {
        if (value != null) {
            map.put(key, value);
        }
    }
}
