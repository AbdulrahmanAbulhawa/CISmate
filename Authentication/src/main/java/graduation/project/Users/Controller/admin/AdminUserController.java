package graduation.project.Users.Controller.admin;

import graduation.project.Users.Models.records.RegistrationRequest;
import graduation.project.Users.Models.records.UserDTO;
import graduation.project.Users.Service.AdminService.AdminUserService;
import graduation.project.Users.Service.UserService.UserProfileService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@CrossOrigin
@RequestMapping("/api/admin")
public class AdminUserController {

    private final AdminUserService adminUserService;
    private final UserProfileService userProfileService;
    public AdminUserController(AdminUserService adminUserService, UserProfileService userProfileService) {
        this.adminUserService = adminUserService;
        this.userProfileService = userProfileService;
    }

    @GetMapping("/getAllUsers")
    public List<String> getAllUsers() {
        return adminUserService.getAllUsers();
    }

    @GetMapping("/getUser/{email:.+}")
    public UserDTO getUser(@PathVariable String email) {
        return userProfileService.userInfo(email);
    }

    @PostMapping("/users")
    public UserDTO adminCreateUser(@RequestBody RegistrationRequest req) {
        return adminUserService.adminCreateUser(req);
    }

    @PutMapping("/{email:.+}")
    public UserDTO adminUpdateUser(@PathVariable String email, @RequestBody UserDTO req) {
        return adminUserService.adminUpdateUser(email, req);
    }

    @DeleteMapping("/{email:.+}")
    public void adminDeleteUser(@PathVariable String email) {
        adminUserService.adminDeleteUser(email);
    }
}
