package synelix_backend;

import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * End-to-end checks over the real filter chain.
 *
 * <p>These run against the seeded demo cohort with the ML service assumed
 * absent, which is the harder case: everything must still respond, using the
 * labelled fallbacks.</p>
 */
@SpringBootTest
@ActiveProfiles("test")
class SynelixApiIntegrationTest {

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private ObjectMapper objectMapper;

    private MockMvc mockMvc;

    private static String studentToken;
    private static String recruiterToken;
    private static String institutionToken;

    @BeforeAll
    static void resetTokens() {
        studentToken = null;
        recruiterToken = null;
        institutionToken = null;
    }

    private MockMvc mvc() {
        if (mockMvc == null) {
            mockMvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
        }
        return mockMvc;
    }

    private String login(String email) throws Exception {
        MvcResult result = mvc().perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(String.format(
                                "{\"email\":\"%s\",\"password\":\"synelix123\"}", email)))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode body = objectMapper.readTree(result.getResponse().getContentAsString());
        return body.get("token").asString();
    }

    private String studentToken() throws Exception {
        if (studentToken == null) {
            studentToken = login("student@synelix.dev");
        }
        return studentToken;
    }

    private String recruiterToken() throws Exception {
        if (recruiterToken == null) {
            recruiterToken = login("recruiter@synelix.dev");
        }
        return recruiterToken;
    }

    private String institutionToken() throws Exception {
        if (institutionToken == null) {
            institutionToken = login("tpo@synelix.dev");
        }
        return institutionToken;
    }

    // ------------------------------------------------------------------
    // Authentication
    // ------------------------------------------------------------------

    @Test
    void loginReturnsATokenAndTheUsersRole() throws Exception {
        mvc().perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"student@synelix.dev\",\"password\":\"synelix123\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.user.role").value("STUDENT"));
    }

    @Test
    void loginWithAWrongPasswordIsRejected() throws Exception {
        mvc().perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"student@synelix.dev\",\"password\":\"wrong-password\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void loginDoesNotRevealWhetherAnEmailIsRegistered() throws Exception {
        MvcResult unknownEmail = mvc().perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"nobody@synelix.dev\",\"password\":\"synelix123\"}"))
                .andExpect(status().isBadRequest())
                .andReturn();

        MvcResult wrongPassword = mvc().perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"student@synelix.dev\",\"password\":\"nope\"}"))
                .andExpect(status().isBadRequest())
                .andReturn();

        String first = objectMapper.readTree(unknownEmail.getResponse()
                .getContentAsString()).get("message").asString();
        String second = objectMapper.readTree(wrongPassword.getResponse()
                .getContentAsString()).get("message").asString();

        org.assertj.core.api.Assertions.assertThat(first).isEqualTo(second);
    }

    @Test
    void registrationRejectsAShortPassword() throws Exception {
        mvc().perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Test User","email":"short@synelix.dev",
                                 "password":"abc","role":"STUDENT"}"""))
                .andExpect(status().isBadRequest());
    }

    // ------------------------------------------------------------------
    // Authorisation
    // ------------------------------------------------------------------

    @Test
    void anonymousRequestsGet401() throws Exception {
        mvc().perform(get("/api/students/profile"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void aRecruiterCannotReachInstitutionAnalytics() throws Exception {
        mvc().perform(get("/api/institution/stats")
                        .header("Authorization", "Bearer " + recruiterToken()))
                .andExpect(status().isForbidden());
    }

    @Test
    void aStudentCannotReachRecruiterSearch() throws Exception {
        mvc().perform(get("/api/companies/candidates")
                        .header("Authorization", "Bearer " + studentToken()))
                .andExpect(status().isForbidden());
    }

    @Test
    void aStudentCannotReadAnotherStudentsProfile() throws Exception {
        mvc().perform(get("/api/students/profile")
                        .param("email", "student05@synelix.dev")
                        .header("Authorization", "Bearer " + studentToken()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(
                        org.hamcrest.Matchers.containsString("your own student record")));
    }

    @Test
    void anInstitutionUserCanReadAnyStudentProfile() throws Exception {
        mvc().perform(get("/api/students/profile")
                        .param("email", "student05@synelix.dev")
                        .header("Authorization", "Bearer " + institutionToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("student05@synelix.dev"));
    }

    // ------------------------------------------------------------------
    // Core features
    // ------------------------------------------------------------------

    @Test
    void studentProfileCarriesTheSeededSignals() throws Exception {
        mvc().perform(get("/api/students/profile")
                        .header("Authorization", "Bearer " + studentToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("student@synelix.dev"))
                .andExpect(jsonPath("$.cgpa").isNumber())
                .andExpect(jsonPath("$.placementProbability").isNumber())
                .andExpect(jsonPath("$.skills").isArray());
    }

    @Test
    void predictionAlwaysRespondsAndNamesItsSource() throws Exception {
        mvc().perform(post("/api/prediction/evaluate")
                        .header("Authorization", "Bearer " + studentToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"cgpa\":8.7,\"dsaSolved\":345,\"aptitudeScore\":88}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.probability").isNumber())
                .andExpect(jsonPath("$.tier").isNotEmpty())
                .andExpect(jsonPath("$.modelSource").isNotEmpty())
                .andExpect(jsonPath("$.factorInsights").isArray());
    }

    @Test
    void predictionRejectsAnOutOfRangeCgpa() throws Exception {
        mvc().perform(post("/api/prediction/evaluate")
                        .header("Authorization", "Bearer " + studentToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"cgpa\":42.0}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.cgpa").isNotEmpty());
    }

    @Test
    void skillGapReturnsBenchmarksAndDeficits() throws Exception {
        mvc().perform(get("/api/students/skill-gap")
                        .header("Authorization", "Bearer " + studentToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.targetRole").isNotEmpty())
                .andExpect(jsonPath("$.benchmarks").isArray())
                .andExpect(jsonPath("$.deficits").isArray());
    }

    @Test
    void roadmapReturnsPhasedTasks() throws Exception {
        mvc().perform(get("/api/students/roadmap")
                        .header("Authorization", "Bearer " + studentToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.phases").isArray())
                .andExpect(jsonPath("$.phases[0].tasks").isArray())
                .andExpect(jsonPath("$.modelSource").isNotEmpty());
    }

    @Test
    void togglingARoadmapTaskPersists() throws Exception {
        mvc().perform(post("/api/students/roadmap/toggle")
                        .param("taskId", "t1")
                        .param("done", "true")
                        .header("Authorization", "Bearer " + studentToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.done").value(true));

        mvc().perform(get("/api/students/roadmap")
                        .header("Authorization", "Bearer " + studentToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.phases[0].tasks[0].done").value(true));
    }

    @Test
    void resumeAnalysisReportsHonestlyWhenNoTextIsSupplied() throws Exception {
        mvc().perform(post("/api/students/resume/analyze")
                        .header("Authorization", "Bearer " + studentToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"resumeText\":\"\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.analysed").value(false))
                .andExpect(jsonPath("$.overallScore").doesNotExist());
    }

    @Test
    void recruiterSearchFiltersByReadinessScore() throws Exception {
        MvcResult result = mvc().perform(get("/api/companies/candidates")
                        .param("minScore", "85")
                        .header("Authorization", "Bearer " + recruiterToken()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode candidates = objectMapper.readTree(result.getResponse().getContentAsString());
        for (JsonNode candidate : candidates) {
            org.assertj.core.api.Assertions
                    .assertThat(candidate.get("aiScore").asInt())
                    .isGreaterThanOrEqualTo(85);
        }
    }

    @Test
    void shortlistTogglesOnAndOffAndIsScopedToTheRecruiter() throws Exception {
        MvcResult first = mvc().perform(post("/api/companies/candidates/STU-003/shortlist")
                        .header("Authorization", "Bearer " + recruiterToken()))
                .andExpect(status().isOk())
                .andReturn();
        boolean afterFirst = objectMapper.readTree(first.getResponse()
                .getContentAsString()).get("shortlisted").asBoolean();

        MvcResult second = mvc().perform(post("/api/companies/candidates/STU-003/shortlist")
                        .header("Authorization", "Bearer " + recruiterToken()))
                .andExpect(status().isOk())
                .andReturn();
        boolean afterSecond = objectMapper.readTree(second.getResponse()
                .getContentAsString()).get("shortlisted").asBoolean();

        org.assertj.core.api.Assertions.assertThat(afterFirst).isNotEqualTo(afterSecond);
    }

    @Test
    void unknownCandidateIdReturns404() throws Exception {
        mvc().perform(get("/api/companies/candidates/STU-99999")
                        .header("Authorization", "Bearer " + recruiterToken()))
                .andExpect(status().isNotFound());
    }

    @Test
    void institutionStatsAggregateTheRealCohort() throws Exception {
        mvc().perform(get("/api/institution/stats")
                        .header("Authorization", "Bearer " + institutionToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalStudents").isNumber())
                .andExpect(jsonPath("$.placementRate").isNotEmpty())
                .andExpect(jsonPath("$.departmentsCount").isNumber());
    }

    @Test
    void schedulingADriveComputesEligibilityFromTheCohort() throws Exception {
        mvc().perform(post("/api/institution/drives")
                        .header("Authorization", "Bearer " + institutionToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"company":"Test Corp","role":"SDE-1",
                                 "date":"01 Dec 2026","minCgpa":8.0,"minReadiness":85}"""))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.company").value("Test Corp"))
                .andExpect(jsonPath("$.eligibleCount").isNumber())
                .andExpect(jsonPath("$.status").value("Scheduled"));
    }

    @Test
    void schedulingADriveRequiresACompanyName() throws Exception {
        mvc().perform(post("/api/institution/drives")
                        .header("Authorization", "Bearer " + institutionToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"role\":\"SDE-1\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.company").isNotEmpty());
    }

    @Test
    void copilotAnswersUsingTheStudentsOwnRecord() throws Exception {
        mvc().perform(post("/api/copilot/chat")
                        .header("Authorization", "Bearer " + studentToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"query\":\"where do I stand?\",\"role\":\"student\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.reply").isNotEmpty())
                .andExpect(jsonPath("$.source").isNotEmpty());
    }
}
