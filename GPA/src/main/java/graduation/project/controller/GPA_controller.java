package graduation.project.controller;

import graduation.project.Service.GPA_service;
import graduation.project.model.TotalGpa;
import graduation.project.model.semesterGPA.GpaListRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/gpa")
@CrossOrigin
public class GPA_controller {

    private final GPA_service service;

    /* required data for calculateTotalGpa {
  "totalHours": 123,
  "totalGpa": 2.67,
  "semesterHours": 15,
  "semesterGpa": 2.9
}*/
    @PostMapping("/calculateTotalGpa")
    public double calculateTotalGpa(@RequestBody TotalGpa totalGpa) {
        return service.calculateGpa(totalGpa.getTotalGpa(), totalGpa.getSemesterGpa(), totalGpa.getTotalHours(), totalGpa.getSemesterHours());
    }

    /* required data for calculateSemesterGpa {
  "subjects": [
    { "grade": "A", "creditNumOfHours": 3 },
    { "grade": "B+", "creditNumOfHours": 4 },
    { "grade": "C-", "creditNumOfHours": 2 }
  ]
}*/
    @PostMapping("/calculateSemesterGpa")
    public double calculateSemesterGpa(@RequestBody GpaListRequest request) {
        return service.calculateSemesterGpa(request.getSubjects());
    }

}
