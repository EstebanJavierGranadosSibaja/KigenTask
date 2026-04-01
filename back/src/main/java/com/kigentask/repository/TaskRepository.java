package com.kigentask.repository;

import com.kigentask.model.Task;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TaskRepository extends JpaRepository<Task, Long> {

    @Query("""
            select distinct t
            from Task t
            join t.project p
            left join t.assignee a
            where (:projectId is null or p.id = :projectId)
              and (:assigneeId is null or a.id = :assigneeId)
              and (p.owner.id = :userId or t.reporter.id = :userId or a.id = :userId)
            order by t.createdAt desc
            """)
    List<Task> searchAccessibleTasks(
            @Param("userId") Long userId,
            @Param("projectId") Long projectId,
            @Param("assigneeId") Long assigneeId
    );
}