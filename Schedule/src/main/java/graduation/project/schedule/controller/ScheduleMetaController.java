// File: Schedule/src/main/java/graduation/project/schedule/controller/ScheduleMetaController.java
package graduation.project.schedule.controller;

import graduation.project.schedule.service.ScheduleMetaService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/schedule/meta")
@RequiredArgsConstructor
public class ScheduleMetaController {

    private final ScheduleMetaService metaService;

    /**
     * Returns available elective tags for dropdown UI.
     * Source: course.tags of elective courses.
     *
     * Example response:
     * ["ai","cloud","devops","mlops","nlp",...]
     */
    @GetMapping("/elective-tags")
    public List<String> electiveTags() {
        return metaService.getElectiveTags();
    }
}
