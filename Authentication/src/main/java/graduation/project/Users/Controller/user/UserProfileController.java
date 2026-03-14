package graduation.project.Users.Controller.user;

import graduation.project.Users.Models.records.UserDTO;
import graduation.project.Users.Service.UserService.UserProfileService;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@CrossOrigin
public class UserProfileController {

    private final UserProfileService userProfileService;
    public UserProfileController(UserProfileService userProfileService) {
        this.userProfileService = userProfileService;
    }

    @GetMapping("/userInfo")
    public UserDTO userInfo(Principal principal) {
        return userProfileService.userInfo(principal.getName());
    }

    @PatchMapping("/userInfo")
    public UserDTO updateUserInfo(@RequestBody UserDTO req, Principal principal) {
        return userProfileService.updateUser(principal.getName(), req);
    }
}
