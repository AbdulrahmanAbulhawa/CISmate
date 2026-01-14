package graduation.project.dto.admin;

public record TextItemUpdateRequest(
        String text,
        Integer orderIndex
) {}
