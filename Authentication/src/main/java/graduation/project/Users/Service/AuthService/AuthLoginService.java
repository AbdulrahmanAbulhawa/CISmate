package graduation.project.Users.Service.AuthService;

import graduation.project.AuthBasics.service.JwtService;
import graduation.project.Users.Models.records.LoginRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Service;

@RequiredArgsConstructor
@Service
public class AuthLoginService {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    public String verify(LoginRequest req) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(req.email(), req.password())
            );
            return jwtService.generateToken(req.email());
        } catch (BadCredentialsException ex) {
            return "Login Failed";
        }
    }
}