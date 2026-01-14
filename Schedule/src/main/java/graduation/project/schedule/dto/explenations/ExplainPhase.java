// File: Schedule/src/main/java/graduation/project/schedule/dto/explenations/ExplainPhase.java
package graduation.project.schedule.dto.explenations;

public enum ExplainPhase {
    MUST_TAKE,
    TEMPLATE,

    // ✅ NEW
    BACKLOG,

    POOL,
    BEAM,

    // used by analyzeElectiveFailures()
    ELECTIVE_ANALYSIS
}
