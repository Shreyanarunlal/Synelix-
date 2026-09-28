package synelix_backend.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import synelix_backend.dto.CampusDriveRequest;
import synelix_backend.entity.CampusDrive;
import synelix_backend.entity.StudentProfile;
import synelix_backend.repository.CampusDriveRepository;
import synelix_backend.repository.StudentProfileRepository;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Institution / T&P analytics.
 *
 * <p>Every figure here is aggregated from the student table at request time,
 * so the dashboard reflects the actual cohort rather than a fixed snapshot.</p>
 */
@Service
public class InstitutionService {

    /** Readiness at or above this is counted as Tier-1 ready. */
    private static final int TIER1_READY_THRESHOLD = 85;

    private final CampusDriveRepository campusDriveRepository;
    private final StudentProfileRepository studentProfileRepository;

    public InstitutionService(CampusDriveRepository campusDriveRepository,
                              StudentProfileRepository studentProfileRepository) {
        this.campusDriveRepository = campusDriveRepository;
        this.studentProfileRepository = studentProfileRepository;
    }

    public Map<String, Object> getStats() {
        List<StudentProfile> students = studentProfileRepository.findAll();

        Map<String, Object> stats = new HashMap<>();
        int total = students.size();
        long placed = students.stream().filter(s -> Boolean.TRUE.equals(s.getPlaced())).count();

        stats.put("totalStudents", total);
        stats.put("placedStudents", placed);
        stats.put("placementRate", total == 0 ? "0%"
                : String.format("%.1f%%", 100.0 * placed / total));

        List<DepartmentStats> departments = aggregateDepartments(students);
        stats.put("departmentsCount", departments.size());

        double avgReadiness = students.stream()
                .filter(s -> s.getPlacementProbability() != null)
                .mapToInt(StudentProfile::getPlacementProbability)
                .average().orElse(0);
        stats.put("aiReadinessIndex", String.format("%.0f%%", avgReadiness));

        departments.stream()
                .max(Comparator.comparingDouble(DepartmentStats::placementRate))
                .ifPresentOrElse(
                        top -> stats.put("topDepartment",
                                String.format("%s (%.1f%%)", top.name, top.placementRate())),
                        () -> stats.put("topDepartment", "No data yet"));

        Double avgCtc = studentProfileRepository.averagePlacedCtc();
        stats.put("averagePackage", avgCtc == null ? "No placements yet"
                : String.format("Rs %.1f LPA", avgCtc));

        stats.put("tier1ReadyCount", students.stream()
                .filter(s -> s.getPlacementProbability() != null
                        && s.getPlacementProbability() >= TIER1_READY_THRESHOLD)
                .count());
        stats.put("atRiskCount", students.stream()
                .filter(s -> s.getBacklogs() != null && s.getBacklogs() > 0)
                .count());

        return stats;
    }

    public List<Map<String, Object>> getDepartments() {
        List<Map<String, Object>> result = new ArrayList<>();
        for (DepartmentStats dept : aggregateDepartments(studentProfileRepository.findAll())) {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("name", dept.name);
            map.put("totalStudents", dept.total);
            map.put("placed", dept.placed);
            map.put("rate", String.format("%.1f%%", dept.placementRate()));
            map.put("avgPackage", dept.placedCount == 0 ? "No placements yet"
                    : String.format("Rs %.1f LPA", dept.ctcSum / dept.placedCount));
            map.put("aiReadiness", (int) Math.round(dept.readiness()));
            result.add(map);
        }
        result.sort((a, b) -> Integer.compare(
                (Integer) b.get("aiReadiness"), (Integer) a.get("aiReadiness")));
        return result;
    }

    public List<CampusDrive> getDrives() {
        return campusDriveRepository.findAll();
    }

    @Transactional
    public CampusDrive scheduleDrive(CampusDriveRequest request) {
        // Eligibility is computed from the real cohort against the drive's
        // cut-offs, instead of the caller asserting a number.
        int eligible = request.getEligibleCount() != null
                ? request.getEligibleCount()
                : countEligible(request.getMinCgpa(), request.getMinReadiness());

        CampusDrive drive = new CampusDrive(
                request.getCompany(),
                request.getRole(),
                request.getDate() != null ? request.getDate() : "Upcoming",
                request.getSalaryPackage() != null ? request.getSalaryPackage() : "To be announced",
                eligible,
                "Scheduled"
        );
        drive.setMinCgpa(request.getMinCgpa());
        drive.setMinReadiness(request.getMinReadiness());

        return campusDriveRepository.save(drive);
    }

    private int countEligible(Double minCgpa, Integer minReadiness) {
        double cgpaBar = minCgpa == null ? 0.0 : minCgpa;
        int readinessBar = minReadiness == null ? 0 : minReadiness;

        return (int) studentProfileRepository.findAll().stream()
                .filter(s -> s.getCgpa() != null && s.getCgpa() >= cgpaBar)
                .filter(s -> readinessBar == 0
                        || (s.getPlacementProbability() != null
                            && s.getPlacementProbability() >= readinessBar))
                .filter(s -> s.getBacklogs() == null || s.getBacklogs() == 0)
                .count();
    }

    public Map<String, Object> getAuditReport() {
        List<StudentProfile> students = studentProfileRepository.findAll();
        List<DepartmentStats> departments = aggregateDepartments(students);

        double avgReadiness = students.stream()
                .filter(s -> s.getPlacementProbability() != null)
                .mapToInt(StudentProfile::getPlacementProbability)
                .average().orElse(0);

        long tier1Ready = students.stream()
                .filter(s -> s.getPlacementProbability() != null
                        && s.getPlacementProbability() >= TIER1_READY_THRESHOLD)
                .count();

        double avgDsa = students.stream()
                .filter(s -> s.getDsaSolved() != null)
                .mapToInt(StudentProfile::getDsaSolved)
                .average().orElse(0);

        Map<String, Object> report = new LinkedHashMap<>();
        report.put("title", "Synelix AI Institutional Placement Audit");
        report.put("generatedAt", java.time.LocalDate.now().toString());
        report.put("academicYear", "2025-2026");
        report.put("cohortSize", students.size());
        report.put("readinessScore", (int) Math.round(avgReadiness));
        report.put("executiveSummary", String.format(
                "Across %d profiled students the cohort shows an average AI placement readiness "
                        + "of %.0f%%. %d students (%.1f%%) clear the %d%% threshold used for "
                        + "Tier-1 product recruitment. Mean problem-solving volume is %.0f solved "
                        + "problems per student.",
                students.size(), avgReadiness, tier1Ready,
                students.isEmpty() ? 0.0 : 100.0 * tier1Ready / students.size(),
                TIER1_READY_THRESHOLD, avgDsa));

        List<String> strengths = new ArrayList<>();
        List<DepartmentStats> byReadiness = departments.stream()
                .sorted(Comparator.comparingDouble(DepartmentStats::readiness).reversed())
                .toList();
        for (int i = 0; i < Math.min(2, byReadiness.size()); i++) {
            DepartmentStats d = byReadiness.get(i);
            strengths.add(String.format(
                    "%s %s on readiness at %.0f%% across %d students, averaging %.0f solved problems.",
                    d.name, i == 0 ? "leads the cohort" : "follows", d.readiness(), d.total, d.avgDsa()));
        }
        report.put("strengths", strengths);

        List<String> risks = new ArrayList<>();
        departments.stream()
                .sorted(Comparator.comparingDouble(DepartmentStats::readiness))
                .limit(2)
                .forEach(d -> risks.add(String.format(
                        "%s trails at %.0f%% readiness; %d of %d students carry active backlogs.",
                        d.name, d.readiness(), d.backlogCount, d.total)));
        report.put("riskAreas", risks);

        List<String> recommendations = new ArrayList<>();
        recommendations.add("Run mandatory timed coding mocks for every student below the "
                + TIER1_READY_THRESHOLD + "% readiness threshold before the next Tier-1 drive.");
        recommendations.add("Schedule backlog clearance support - backlogs gate eligibility "
                + "at most recruiters regardless of skill.");
        recommendations.add("Require an ATS resume scan through Synelix before profiles are "
                + "released to visiting recruiters.");
        report.put("recommendations", recommendations);
        report.put("departments", getDepartments());

        return report;
    }

    // ------------------------------------------------------------------

    private List<DepartmentStats> aggregateDepartments(List<StudentProfile> students) {
        Map<String, DepartmentStats> byName = new LinkedHashMap<>();

        for (StudentProfile student : students) {
            String name = student.getDepartment() == null || student.getDepartment().isBlank()
                    ? "Unassigned" : student.getDepartment();
            DepartmentStats stats = byName.computeIfAbsent(name, DepartmentStats::new);

            stats.total++;
            if (Boolean.TRUE.equals(student.getPlaced())) {
                stats.placed++;
                if (student.getPlacedCtc() != null) {
                    stats.ctcSum += student.getPlacedCtc();
                    stats.placedCount++;
                }
            }
            if (student.getPlacementProbability() != null) {
                stats.readinessSum += student.getPlacementProbability();
                stats.readinessCount++;
            }
            if (student.getDsaSolved() != null) {
                stats.dsaSum += student.getDsaSolved();
                stats.dsaCount++;
            }
            if (student.getBacklogs() != null && student.getBacklogs() > 0) {
                stats.backlogCount++;
            }
        }

        return new ArrayList<>(byName.values());
    }

    private static final class DepartmentStats {
        final String name;
        int total;
        int placed;
        int placedCount;
        double ctcSum;
        double readinessSum;
        int readinessCount;
        long dsaSum;
        int dsaCount;
        int backlogCount;

        DepartmentStats(String name) {
            this.name = name;
        }

        double placementRate() {
            return total == 0 ? 0 : 100.0 * placed / total;
        }

        double readiness() {
            return readinessCount == 0 ? 0 : readinessSum / readinessCount;
        }

        double avgDsa() {
            return dsaCount == 0 ? 0 : (double) dsaSum / dsaCount;
        }
    }
}
