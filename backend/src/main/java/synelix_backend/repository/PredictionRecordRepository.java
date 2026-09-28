package synelix_backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import synelix_backend.entity.PredictionRecord;

import java.util.List;

@Repository
public interface PredictionRecordRepository extends JpaRepository<PredictionRecord, Long> {
    List<PredictionRecord> findByUserEmailOrderByCreatedAtDesc(String userEmail);
}
