package graduation.project.Users.Controller.auth;

import graduation.project.Users.Models.records.LoginRequest;
import graduation.project.Users.Models.records.RegistrationRequest;
import graduation.project.Users.Models.user.UserProfile;
import graduation.project.Users.Service.AuthService.AuthLoginService;
import graduation.project.Users.Service.AuthService.AuthRegisterService;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
@CrossOrigin
public class AuthController {

    private final AuthRegisterService authRegisterService;
    private final AuthLoginService authLoginService;
    public AuthController(AuthRegisterService authRegisterService, AuthLoginService authLoginService) {
        this.authRegisterService = authRegisterService;
        this.authLoginService = authLoginService;
    }

    @PostMapping("/api/register")
    public UserProfile reg(@RequestBody RegistrationRequest req) {
        return authRegisterService.register(req);
    }

    @PostMapping("/login")
    public String login(@RequestBody LoginRequest req) {
        return authLoginService.verify(req);
    }
}
