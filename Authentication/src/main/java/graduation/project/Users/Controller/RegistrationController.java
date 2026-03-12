package graduation.project.Users.Controller;

import graduation.project.Users.Models.records.LoginRequest;
import graduation.project.Users.Models.records.RegistrationRequest;
import graduation.project.Users.Models.records.UserDTO;
import graduation.project.Users.Models.user.UserProfile;
import graduation.project.Users.Service.AdminService.AdminUserService;
import graduation.project.Users.Service.AuthService.AuthLoginService;
import graduation.project.Users.Service.AuthService.AuthRegisterService;
import graduation.project.Users.Service.UserService.UserProfileService;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@CrossOrigin
public class RegistrationController {

    private final AuthRegisterService authRegisterService;
    private final AuthLoginService authLoginService;
    private final UserProfileService userProfileService;
    private final AdminUserService adminUserService;

    public RegistrationController(
            AuthRegisterService authRegisterService,
            AuthLoginService authLoginService,
            UserProfileService userProfileService,
            AdminUserService adminUserService
    ) {
        this.authRegisterService = authRegisterService;
        this.authLoginService = authLoginService;
        this.userProfileService = userProfileService;
        this.adminUserService = adminUserService;
    }

    @PostMapping("/api/register")
    public UserProfile reg(@RequestBody RegistrationRequest req) {
        return authRegisterService.register(req);
    }

    @PostMapping("/login")
    public String login(@RequestBody LoginRequest req) {
        return authLoginService.verify(req);
    }

    @GetMapping("/userInfo")
    public UserDTO userInfo(Principal principal) {
        return userProfileService.userInfo(principal.getName());
    }

    @PatchMapping("/userInfo")
    public UserDTO updateUserInfo(@RequestBody UserDTO req, Principal principal) {
        return userProfileService.updateUser(principal.getName(), req);
    }

    @GetMapping("/api/admin/getAllUsers")
    public List<String> getAllUsers() {
        return adminUserService.getAllUsers();
    }

    @GetMapping("/api/admin/getUser/{email:.+}")
    public UserDTO getUser(@PathVariable String email) {
        return userProfileService.userInfo(email);
    }

    @PostMapping("/api/admin/users")
    public UserDTO adminCreateUser(@RequestBody RegistrationRequest req) {
        return adminUserService.adminCreateUser(req);
    }

    @PutMapping("/api/admin/users/{email:.+}")
    public UserDTO adminUpdateUser(@PathVariable String email, @RequestBody UserDTO req) {
        return adminUserService.adminUpdateUser(email, req);
    }

    @DeleteMapping("/api/admin/users/{email:.+}")
    public void adminDeleteUser(@PathVariable String email) {
        adminUserService.adminDeleteUser(email);
    }
}