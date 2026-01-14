package graduation.project.dto.admin;

public record CareerCourseAdminResponse(
        Long id,
        int orderIndex,
        String note,
        Long courseId,
        String courseCode,
        String courseName
) {
    public static CareerCourseAdminResponse from(
            Long id,
            int orderIndex,
            String note,
            Long courseId,
            String courseCode,
            String courseName
    ) {
        return new CareerCourseAdminResponse(id, orderIndex, note, courseId, courseCode, courseName);
    }
}
