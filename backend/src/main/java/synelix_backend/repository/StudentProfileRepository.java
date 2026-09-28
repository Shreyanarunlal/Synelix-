package synelix_backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import synelix_backend.entity.StudentProfile;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudentProfileRepository extends JpaRepository<StudentProfile, Long> {

    Optional<StudentProfile> findByEmail(String email);

    boolean existsByEmail(String email);

    List<StudentProfile> findByDepartment(String department);

    List<StudentProfile> findByPlacementProbabilityGreaterThanEqual(Integer minScore);

    @Query("SELECT DISTINCT s.department FROM StudentProfile s WHERE s.department IS NOT NULL ORDER BY s.department")
    List<String> findDistinctDepartments();

    /**
     * Recruiter candidate search.
     *
     * <p>Matches the free-text term against name, department, college and any
     * declared skill, so searching "kafka" finds students whose skill list
     * contains it even though it never appears in their name.</p>
     */
    @Query("""
            SELECT DISTINCT s FROM StudentProfile s
            LEFT JOIN s.skills sk
            WHERE (:search IS NULL
                   OR LOWER(s.name) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(s.department) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(s.college) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(sk.name) LIKE LOWER(CONCAT('%', :search, '%')))
              AND (:department IS NULL
                   OR LOWER(s.department) LIKE LOWER(CONCAT('%', :department, '%')))
              AND (:minScore IS NULL OR s.placementProbability >= :minScore)
            ORDER BY s.placementProbability DESC
            """)
    List<StudentProfile> search(@Param("search") String search,
                                @Param("department") String department,
                                @Param("minScore") Integer minScore);

    @Query("SELECT COUNT(s) FROM StudentProfile s WHERE s.placed = true")
    long countPlaced();

    @Query("SELECT AVG(s.placedCtc) FROM StudentProfile s WHERE s.placed = true AND s.placedCtc IS NOT NULL")
    Double averagePlacedCtc();

    @Query("SELECT AVG(s.placementProbability) FROM StudentProfile s WHERE s.placementProbability IS NOT NULL")
    Double averageReadiness();
}
