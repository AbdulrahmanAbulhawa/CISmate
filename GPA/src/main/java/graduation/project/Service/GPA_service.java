package graduation.project.Service;

import graduation.project.model.semesterGPA.GpaEntry;
import graduation.project.model.semesterGPA.gradeConverter;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class GPA_service {



    public double calculateGpa(double totalGpa, double semesterGpa, double totalHours, double semesterHours) {
        return (totalGpa * totalHours + semesterGpa * semesterHours) / (totalHours + semesterHours);
    }

    public double calculateSemesterGpa(List<GpaEntry> subjects) {
        double totalPoints = 0;
        int totalCredits = 0;

        for (GpaEntry subject : subjects) {
            double gradePoint = gradeConverter.convert(subject.getGrade());
            if (gradePoint < 0) {
                throw new IllegalArgumentException("Invalid grade: " + subject.getGrade());
            }

            totalPoints += gradePoint * subject.getCreditNumOfHours();
            totalCredits += subject.getCreditNumOfHours();
        }

        if (totalCredits == 0) return 0;
        return totalPoints / totalCredits;
    }


}
