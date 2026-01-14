// File: Schedule/src/main/java/graduation/project/schedule/service/ScheduleMetaService.java
package graduation.project.schedule.service;

import graduation.project.schedule.repo.CourseReadRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ScheduleMetaService {

    private final CourseReadRepository courseReadRepository;

    /**
     * Dropdown tags source of truth:
     * - Only tags that already exist in the DB (course.tags)
     * - Only from ELECTIVE courses (category contains "elective")
     * - Normalized: trim + lowercase + strip quotes
     */
    @Transactional(readOnly = true)
    public List<String> getElectiveTags() {
        List<String> rawCsv = courseReadRepository.findElectiveTagsCsv();
        if (rawCsv == null || rawCsv.isEmpty()) return List.of();

        Set<String> tags = new HashSet<>();
        for (String csv : rawCsv) {
            if (csv == null || csv.isBlank()) continue;
            for (String t : csv.split(",")) {
                String norm = normalizeTag(t);
                if (norm != null) tags.add(norm);
            }
        }

        return tags.stream()
                .sorted()
                .collect(Collectors.toList());
    }

    private static String normalizeTag(String t) {
        if (t == null) return null;

        String s = t.trim().toLowerCase();
        if (s.isEmpty()) return null;

        // Strip wrapping quotes repeatedly (handles: "cloud  or  cloud"  or  'cloud')
        s = stripWrappingQuotes(s);

        // After stripping, re-trim
        s = s.trim();
        if (s.isEmpty()) return null;

        // Also remove any remaining leading/trailing quotes (edge cases)
        while (s.startsWith("\"") || s.startsWith("'")) s = s.substring(1).trim();
        while (s.endsWith("\"") || s.endsWith("'")) s = s.substring(0, s.length() - 1).trim();

        return s.isEmpty() ? null : s;
    }

    private static String stripWrappingQuotes(String s) {
        if (s == null) return null;

        boolean changed = true;
        while (changed) {
            changed = false;

            if (s.length() >= 2) {
                char first = s.charAt(0);
                char last = s.charAt(s.length() - 1);

                // If both ends are the same quote type, strip them
                if ((first == '"' && last == '"') || (first == '\'' && last == '\'')) {
                    s = s.substring(1, s.length() - 1).trim();
                    changed = true;
                }
            }
        }
        return s;
    }
}
