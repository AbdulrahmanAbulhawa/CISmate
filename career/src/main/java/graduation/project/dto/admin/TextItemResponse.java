package graduation.project.dto.admin;

public record TextItemResponse(
        Long id,
        String text,
        int orderIndex
) {
    public static TextItemResponse from(Long id, String text, int orderIndex) {
        return new TextItemResponse(id, text, orderIndex);
    }
}
