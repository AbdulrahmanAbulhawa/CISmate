// File: src/main/java/graduation/project/USER/models/user/GradeLetter.java
package graduation.project.USER.models.user;

import java.util.Locale;

public enum GradeLetter {

    A("A", 4.0),
    A_MINUS("A-", 3.7),
    B_PLUS("B+", 3.3),
    B("B", 3.0),
    B_MINUS("B-", 2.7),
    C_PLUS("C+", 2.3),
    C("C", 2.0),
    C_MINUS("C-", 1.7),
    D_PLUS("D+", 1.3),
    D("D", 1.0),
    F("F", 0.0);

    private final String display;
    private final double points;

    GradeLetter(String display, double points) {
        this.display = display;
        this.points = points;
    }

    public String display() {
        return display;
    }

    public double points() {
        return points;
    }

    /**
     * Accepts inputs like: "A", "A-", "B+", "b+", "A_MINUS", "b_plus"
     */
    public static GradeLetter fromUserInput(String input) {
        if (input == null) {
            throw new IllegalArgumentException("gradeLetter is required");
        }

        String s = input.trim().toUpperCase(Locale.ROOT);

        // normalize common formats
        s = s.replace(" ", "");
        s = s.replace("__", "_");

        // allow "A_MINUS" / "B_PLUS" style too
        switch (s) {
            case "A-":
            case "A_MINUS":
                return A_MINUS;
            case "B+":
            case "B_PLUS":
                return B_PLUS;
            case "B-":
            case "B_MINUS":
                return B_MINUS;
            case "C+":
            case "C_PLUS":
                return C_PLUS;
            case "C-":
            case "C_MINUS":
                return C_MINUS;
            case "D+":
            case "D_PLUS":
                return D_PLUS;
            default:
                // "A", "B", "C", "D", "F"
                try {
                    return GradeLetter.valueOf(s);
                } catch (Exception ex) {
                    throw new IllegalArgumentException(
                            "Invalid gradeLetter: " + input + " (allowed: A, A-, B+, B, B-, C+, C, C-, D+, D, F)"
                    );
                }
        }
    }
}
