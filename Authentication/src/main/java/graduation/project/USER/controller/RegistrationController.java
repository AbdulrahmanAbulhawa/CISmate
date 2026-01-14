// src/main/java/graduation/project/USER/controller/RegistrationController.java
package graduation.project.USER.controller;

import graduation.project.USER.models.records.LoginRequest;
import graduation.project.USER.models.records.RegistrationRequest;
import graduation.project.USER.models.user.UserProfile;
import graduation.project.USER.models.records.UserDTO;
import graduation.project.USER.Service.RegService;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@CrossOrigin
public class RegistrationController {

    private final RegService service;

    public RegistrationController(RegService service) {
        this.service = service;
    }

    /* ================= Auth / Self endpoints ================= */

    @PostMapping("/api/register")
    public UserProfile reg(@RequestBody RegistrationRequest req) {
        return service.register(req);
    }

    @PostMapping("/login")
    public String login(@RequestBody LoginRequest req) {
        return service.verify(req);
    }

    @GetMapping("/userInfo")
    public UserDTO userInfo(Principal principal) {
        // principal.getName() is the username (your email) set by the JWT filter
        return service.userInfo(principal.getName());
    }

    @PatchMapping("/userInfo")
    public UserDTO updateUserInfo(@RequestBody UserDTO req, Principal principal) {
        return service.updateUser(principal.getName(), req); // saves changes to DB
    }

    /* ================= Admin: Read ================= */

    @GetMapping("/api/admin/getAllUsers")
    public List<String> getAllUsers() {
        return service.getAllUsers();
    }

    @GetMapping("/api/admin/getUser/{email:.+}")
    public UserDTO getUser(@PathVariable String email) {
        return service.userInfo(email);
    }

    /* ================= Admin: Create / Update / Delete ================= */

    // Create a user as admin (uses RegistrationRequest → email/password + optional fields)
    @PostMapping("/api/admin/users")
    public UserDTO adminCreateUser(@RequestBody RegistrationRequest req) {
        return service.adminCreateUser(req);
    }

    // Update a user as admin (partial ok). Allows role changes.
    @PutMapping("/api/admin/users/{email:.+}")
    public UserDTO adminUpdateUser(@PathVariable String email, @RequestBody UserDTO req) {
        return service.adminUpdateUser(email, req);
    }

    // Delete a user as admin (by email)
    @DeleteMapping("/api/admin/users/{email:.+}")
    public void adminDeleteUser(@PathVariable String email) {
        service.adminDeleteUser(email);
    }
}
