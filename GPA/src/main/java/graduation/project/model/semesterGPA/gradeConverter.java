package graduation.project.model.semesterGPA;

import java.util.Map;

public class gradeConverter {

    private static final Map<String, Double> gradeToPoint = Map.ofEntries(
            Map.entry("A", 4.0),
            Map.entry("A-", 3.7),
            Map.entry("B+", 3.3),
            Map.entry("B", 3.0),
            Map.entry("B-", 2.7),
            Map.entry("C+", 2.3),
            Map.entry("C", 2.0),
            Map.entry("C-", 1.7),
            Map.entry("D+", 1.3),
            Map.entry("D", 1.0),
            Map.entry("D-", 0.7),
            Map.entry("F", 0.0)
    );

    public static double convert(String grade) {
        return gradeToPoint.getOrDefault(grade.toUpperCase(), -1.0); // Invalid returns -1.0
    }
}
