package graduation.project.AuthBasics.models;

import graduation.project.USER.models.user.UserProfile;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

public class UserPrinciples implements UserDetails {

    private final UserProfile user;

    public UserPrinciples(UserProfile user) {
        this.user = user;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        // Expect values like "USER" or "ADMIN" in DB; Spring wants "ROLE_*"
        String r = user.getRole() == null ? "USER" : user.getRole().trim().toUpperCase();
        return List.of(new SimpleGrantedAuthority("ROLE_" + r));
    }

    @Override public String getPassword() { return user.getPassword(); }
    @Override public String getUsername() { return user.getEmail(); }
    @Override public boolean isAccountNonExpired() { return true; }
    @Override public boolean isAccountNonLocked() { return true; }
    @Override public boolean isCredentialsNonExpired() { return true; }
    @Override public boolean isEnabled() { return true; }
}
