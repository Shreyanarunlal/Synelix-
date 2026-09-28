package synelix_backend.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.ApplicationArguments;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import synelix_backend.entity.CampusDrive;
import synelix_backend.entity.Role;
import synelix_backend.entity.StudentProfile;
import synelix_backend.entity.StudentSkill;
import synelix_backend.entity.User;
import synelix_backend.repository.CampusDriveRepository;
import synelix_backend.repository.StudentProfileRepository;
import synelix_backend.repository.UserRepository;
import synelix_backend.service.PredictionService;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Random;

/**
 * Seeds a demo cohort on an empty database.
 *
 * <p>The platform is only meaningful with a population to aggregate over: a
 * placement rate, a departmental comparison and a recruiter search all need
 * more than one row. Students are generated from a fixed seed so every run
 * produces the same cohort, then scored through the real prediction path so
 * their readiness numbers come from the model rather than being typed in.</p>
 */
@Component
public class DataSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private static final int COHORT_SIZE = 60;
    private static final long SEED = 20260914L;
    private static final String DEMO_PASSWORD = "synelix123";

    private static final String[] DEPARTMENTS = {
            "Computer Science", "AI & Data Science", "Information Technology",
            "Electronics & Communication", "Electrical Engineering", "Mechanical Engineering"
    };

    private static final String[] COLLEGES = {
            "National Institute of Technology", "Anna University",
            "PSG College of Technology", "Vellore Institute of Technology",
            "SRM Institute of Science and Technology"
    };

    private static final String[] TARGET_ROLES = {
            "Full Stack Developer", "SDE-1 (Product Tier 1)",
            "Data Scientist & AI Engineer", "Cloud & DevOps Engineer"
    };

    private static final String[] FIRST_NAMES = {
            "Arjun", "Priya", "Rahul", "Anjali", "Karan", "Sneha", "Vikram", "Divya",
            "Aditya", "Meera", "Rohan", "Kavya", "Nikhil", "Ananya", "Siddharth",
            "Ishita", "Varun", "Pooja", "Harsh", "Lakshmi"
    };

    private static final String[] LAST_NAMES = {
            "Karthik", "Menon", "Sharma", "Rao", "Verma", "Patel", "Sundaram",
            "Nair", "Iyer", "Reddy", "Gupta", "Krishnan"
    };

    /** Skill pools per target role, so a profile's skills match its ambition. */
    private static final String[][] SKILL_POOLS = {
            {"Java", "React.js", "Spring Boot", "Node.js", "PostgreSQL", "Docker", "REST APIs", "Git"},
            {"Java", "C++", "Data Structures & Algorithms", "System Design", "PostgreSQL", "Redis", "Kafka"},
            {"Python", "Pandas", "NumPy", "Scikit-learn", "PyTorch", "SQL", "NLP", "FastAPI"},
            {"Linux", "Docker", "Kubernetes", "AWS", "Terraform", "CI/CD", "Bash", "Jenkins"}
    };

    private final UserRepository userRepository;
    private final StudentProfileRepository studentProfileRepository;
    private final CampusDriveRepository campusDriveRepository;
    private final PasswordEncoder passwordEncoder;
    private final PredictionService predictionService;
    private final boolean enabled;

    public DataSeeder(UserRepository userRepository,
                      StudentProfileRepository studentProfileRepository,
                      CampusDriveRepository campusDriveRepository,
                      PasswordEncoder passwordEncoder,
                      PredictionService predictionService,
                      @Value("${synelix.seed.enabled:true}") boolean enabled) {
        this.userRepository = userRepository;
        this.studentProfileRepository = studentProfileRepository;
        this.campusDriveRepository = campusDriveRepository;
        this.passwordEncoder = passwordEncoder;
        this.predictionService = predictionService;
        this.enabled = enabled;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (!enabled) {
            return;
        }
        if (studentProfileRepository.count() > 0) {
            log.info("Database already seeded ({} students); skipping",
                    studentProfileRepository.count());
            return;
        }

        log.info("Seeding demo cohort...");
        seedDemoAccounts();
        List<StudentProfile> students = seedStudents();
        seedDrives();

        log.info("Seeded {} students. Demo logins (password '{}'): "
                        + "student@synelix.dev / recruiter@synelix.dev / tpo@synelix.dev",
                students.size(), DEMO_PASSWORD);
    }

    private void seedDemoAccounts() {
        createUser("Arjun Karthik", "student@synelix.dev", Role.STUDENT);
        createUser("Nandita Rao", "recruiter@synelix.dev", Role.COMPANY);
        createUser("Placement Cell", "tpo@synelix.dev", Role.INSTITUTION);
    }

    private void createUser(String name, String email, Role role) {
        if (userRepository.existsByEmail(email)) {
            return;
        }
        userRepository.save(new User(name, email, passwordEncoder.encode(DEMO_PASSWORD), role));
    }

    private List<StudentProfile> seedStudents() {
        Random random = new Random(SEED);
        List<StudentProfile> saved = new ArrayList<>();

        for (int i = 0; i < COHORT_SIZE; i++) {
            // A latent ability score drives every observable, so a strong
            // student is strong across the board rather than randomly mixed.
            double ability = clamp(random.nextGaussian() * 0.9 + 0.2, -2.5, 2.5);

            int roleIndex = random.nextInt(TARGET_ROLES.length);
            String department = departmentFor(ability, random);
            String name = FIRST_NAMES[random.nextInt(FIRST_NAMES.length)]
                    + " " + LAST_NAMES[random.nextInt(LAST_NAMES.length)];

            StudentProfile profile = new StudentProfile();
            profile.setName(i == 0 ? "Arjun Karthik" : name);
            profile.setEmail(i == 0 ? "student@synelix.dev"
                    : String.format("student%02d@synelix.dev", i));
            profile.setPhone(String.format("+91 9%09d", random.nextInt(1_000_000_000)));
            profile.setRollNumber(String.format("2026%s%03d", department.substring(0, 2).toUpperCase(), i));
            profile.setCollege(COLLEGES[random.nextInt(COLLEGES.length)]);
            profile.setDepartment(department);
            profile.setGraduationYear(2026);
            profile.setTargetRole(TARGET_ROLES[roleIndex]);

            profile.setCgpa(round(clamp(7.2 + 0.75 * ability + random.nextGaussian() * 0.4, 5.2, 9.9), 2));
            profile.setDsaSolved((int) clamp(Math.exp(4.7 + 0.55 * ability)
                    + random.nextGaussian() * 30, 10, 620));
            profile.setAptitudeScore((int) clamp(68 + 11 * ability + random.nextGaussian() * 7, 30, 99));
            profile.setProjectsCount((int) clamp(2 + 1.1 * ability + random.nextGaussian() * 0.7, 0, 9));
            profile.setInternshipsMonths(ability > 0.1
                    ? (int) clamp(2 + 1.5 * ability, 0, 12) : 0);
            profile.setCertificationsCount((int) clamp(1 + 0.9 * ability + random.nextGaussian() * 0.5, 0, 7));
            profile.setHackathonsWon((int) clamp(0.4 + 0.6 * ability, 0, 5));
            profile.setCommunicationScore((int) clamp(68 + 8 * ability + random.nextGaussian() * 9, 30, 99));
            profile.setBacklogs(ability < -0.7 ? 1 + random.nextInt(2) : 0);

            // Shuffle before taking a slice: taking a fixed prefix would mean
            // the last entries in each pool never appear on any profile, which
            // makes recruiter skill search silently return nothing for them.
            List<String> pool = new ArrayList<>(List.of(SKILL_POOLS[roleIndex]));
            Collections.shuffle(pool, random);
            int skillCount = 4 + random.nextInt(Math.max(1, pool.size() - 3));
            for (int s = 0; s < Math.min(skillCount, pool.size()); s++) {
                int level = (int) clamp(62 + 10 * ability + random.nextGaussian() * 8, 35, 98);
                profile.addSkill(new StudentSkill(pool.get(s), level, categoryFor(pool.get(s))));
            }

            // Placement outcome for the already-graduated portion of the cohort,
            // so institution analytics have real placed/unplaced data.
            boolean placed = random.nextDouble() < placementChance(ability);
            profile.setPlaced(placed);
            if (placed) {
                profile.setPlacedCompany(companyFor(ability, random));
                profile.setPlacedCtc(round(clamp(Math.exp(1.95 + 0.45 * ability)
                        * (0.9 + random.nextDouble() * 0.3), 3.5, 46.0), 2));
            }

            StudentProfile stored = studentProfileRepository.save(profile);
            // Score through the real prediction path: ML when it is up,
            // heuristic otherwise. Either way the number is computed, not typed.
            predictionService.refreshFor(stored);
            saved.add(stored);
        }

        return saved;
    }

    private double placementChance(double ability) {
        return clamp(0.62 + 0.22 * ability, 0.08, 0.97);
    }

    /** Share of the cohort in each department, in DEPARTMENTS order. */
    private static final double[] DEPARTMENT_SHARES = {0.26, 0.14, 0.18, 0.18, 0.12, 0.12};

    /**
     * Departments are correlated with ability rather than assigned at random.
     *
     * <p>Random assignment produced a cohort where Mechanical outranked
     * Computer Science on readiness, which makes the institution comparison
     * meaningless. Instead each student's noisy ability is converted to a
     * percentile and dropped into the department that owns that slice of the
     * distribution. Going through percentile rather than nearest-offset keeps
     * the department sizes at their intended shares - nearest-offset produced
     * uneven Voronoi cells and left AI &amp; Data Science with three students.
     * The noise makes the bands overlap the way real branches do.</p>
     */
    private String departmentFor(double ability, Random random) {
        double noisy = ability + random.nextGaussian() * 0.5;

        // Ability is drawn from N(0.2, 0.9); convert to an upper-tail
        // percentile so the strongest students fall in the first department.
        double percentile = 1.0 - normalCdf((noisy - 0.2) / 0.9);

        double cumulative = 0;
        for (int i = 0; i < DEPARTMENT_SHARES.length; i++) {
            cumulative += DEPARTMENT_SHARES[i];
            if (percentile <= cumulative) {
                return DEPARTMENTS[i];
            }
        }
        return DEPARTMENTS[DEPARTMENTS.length - 1];
    }

    /** Abramowitz and Stegun 7.1.26 approximation of the standard normal CDF. */
    private static double normalCdf(double z) {
        double sign = z < 0 ? -1 : 1;
        double x = Math.abs(z) / Math.sqrt(2.0);
        double t = 1.0 / (1.0 + 0.3275911 * x);
        double erf = 1.0 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t
                - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
        return 0.5 * (1.0 + sign * erf);
    }

    private String companyFor(double ability, Random random) {
        String[] tier1 = {"Google", "Microsoft", "Amazon", "Nvidia"};
        String[] tier2 = {"Flipkart", "Swiggy", "Goldman Sachs", "Red Hat"};
        String[] tier3 = {"TCS Digital", "Infosys", "Zoho", "Cognizant"};
        if (ability > 1.2) return tier1[random.nextInt(tier1.length)];
        if (ability > 0.3) return tier2[random.nextInt(tier2.length)];
        return tier3[random.nextInt(tier3.length)];
    }

    private static String categoryFor(String skill) {
        return switch (skill) {
            case "Java", "Python", "C++", "Bash" -> "Languages";
            case "React.js", "Node.js" -> "Web";
            case "Spring Boot", "FastAPI", "REST APIs" -> "Backend";
            case "PostgreSQL", "SQL", "Redis", "Kafka" -> "Data";
            case "Docker", "Kubernetes", "AWS", "Terraform", "CI/CD", "Jenkins", "Linux", "Git" -> "DevOps";
            case "Pandas", "NumPy", "Scikit-learn", "PyTorch", "NLP" -> "Machine Learning";
            default -> "Core CS";
        };
    }

    private void seedDrives() {
        if (campusDriveRepository.count() > 0) {
            return;
        }
        campusDriveRepository.save(drive("Google", "Software Engineer", "12 Oct 2026", "Rs 38 LPA", 8.0, 85));
        campusDriveRepository.save(drive("Microsoft", "Product Engineer", "18 Oct 2026", "Rs 42 LPA", 8.0, 85));
        campusDriveRepository.save(drive("Amazon", "Backend Developer", "24 Oct 2026", "Rs 34 LPA", 7.5, 80));
        campusDriveRepository.save(drive("Goldman Sachs", "Analyst", "02 Nov 2026", "Rs 28 LPA", 8.0, 82));
        campusDriveRepository.save(drive("TCS Digital", "Digital Engineer", "10 Nov 2026", "Rs 9.5 LPA", 6.0, 50));
    }

    private CampusDrive drive(String company, String role, String date, String salary,
                              double minCgpa, int minReadiness) {
        int eligible = (int) studentProfileRepository.findAll().stream()
                .filter(s -> s.getCgpa() != null && s.getCgpa() >= minCgpa)
                .filter(s -> s.getPlacementProbability() != null
                        && s.getPlacementProbability() >= minReadiness)
                .filter(s -> s.getBacklogs() == null || s.getBacklogs() == 0)
                .count();

        CampusDrive drive = new CampusDrive(company, role, date, salary, eligible, "Registrations Open");
        drive.setMinCgpa(minCgpa);
        drive.setMinReadiness(minReadiness);
        return drive;
    }

    private static double clamp(double value, double min, double max) {
        return Math.max(min, Math.min(max, value));
    }

    private static double round(double value, int places) {
        double factor = Math.pow(10, places);
        return Math.round(value * factor) / factor;
    }
}
