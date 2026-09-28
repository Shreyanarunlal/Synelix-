package synelix_backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import synelix_backend.entity.Shortlist;

import java.util.List;
import java.util.Optional;

@Repository
public interface ShortlistRepository extends JpaRepository<Shortlist, Long> {

    Optional<Shortlist> findByRecruiterEmailAndStudentId(String recruiterEmail, Long studentId);

    List<Shortlist> findByRecruiterEmail(String recruiterEmail);

    long countByStudentId(Long studentId);
}
