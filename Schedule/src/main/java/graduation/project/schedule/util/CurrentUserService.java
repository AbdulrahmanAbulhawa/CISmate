package graduation.project.schedule.util;

import graduation.project.USER.models.user.UserProfile;
import graduation.project.schedule.repo.UserProfileReadRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CurrentUserService {

    private final UserProfileReadRepository userProfileReadRepository;

    public Long currentUserIdOrThrow() {
        String email = currentUserEmailOrThrow();
        UserProfile profile = userProfileReadRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("Authenticated user not found in DB: " + email));
        return profile.getId();
    }

    public String currentUserEmailOrThrow() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new IllegalStateException("Unauthenticated");
        }
        String name = auth.getName();
        if (name == null || name.isBlank()) {
            throw new IllegalStateException("Authenticated principal has no username/email");
        }
        return name;
    }
}
