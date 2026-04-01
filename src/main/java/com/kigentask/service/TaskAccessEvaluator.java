package com.kigentask.service;

import com.kigentask.model.Project;
import com.kigentask.model.Task;
import java.util.Objects;
import org.springframework.stereotype.Component;

@Component
public class TaskAccessEvaluator {

    public boolean canCreateTask(Project project, Long userId) {
        return project != null
                && project.getOwner() != null
                && Objects.equals(project.getOwner().getId(), userId);
    }

    public boolean canAccessTask(Task task, Long userId) {
        return isProjectOwner(task, userId) || isReporter(task, userId) || isAssignee(task, userId);
    }

    public boolean canEditTask(Task task, Long userId) {
        return isProjectOwner(task, userId) || isReporter(task, userId) || isAssignee(task, userId);
    }

    public boolean canDeleteTask(Task task, Long userId) {
        return isProjectOwner(task, userId) || isReporter(task, userId);
    }

    private boolean isProjectOwner(Task task, Long userId) {
        return task != null
                && task.getProject() != null
                && task.getProject().getOwner() != null
                && Objects.equals(task.getProject().getOwner().getId(), userId);
    }

    private boolean isReporter(Task task, Long userId) {
        return task != null
                && task.getReporter() != null
                && Objects.equals(task.getReporter().getId(), userId);
    }

    private boolean isAssignee(Task task, Long userId) {
        return task != null
                && task.getAssignee() != null
                && Objects.equals(task.getAssignee().getId(), userId);
    }
}