import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { loginUser } from "../api/authApi";

function LoginPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await loginUser(formData);

      const token =
        typeof response.data === "string" ? response.data : response.data.token;

      localStorage.setItem("token", token);

      try {
        const userResponse = await axios.get(
          `http://localhost:8080/api/admin/getUser/${encodeURIComponent(
            formData.email
          )}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const role = userResponse.data.role;
        const normalizedRole = String(role).toUpperCase();

        localStorage.setItem("role", normalizedRole);

        if (normalizedRole === "ADMIN" || normalizedRole === "ROLE_ADMIN") {
          navigate("/admin");
        } else {
          navigate("/home");
        }
      } catch (roleError) {
        localStorage.setItem("role", "USER");
        navigate("/home");
      }
    } catch (err) {
      setError("Login failed");
      console.error(err);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.overlay}>
        <div style={styles.leftSection}>
          <div style={styles.logoBox}>🎓</div>

          <h1 style={styles.mainTitle}>
            Your online
            <br />
            academic advisor.
          </h1>
        </div>

        <div style={styles.rightSection}>
          <div style={styles.card}>
            <div style={styles.logoBoxSmall}>🎓</div>

            <h2 style={styles.cardTitle}>CISmate</h2>
            <p style={styles.cardSubtitle}>Sign in to continue</p>

            <form onSubmit={handleSubmit} style={styles.form}>
              <input
                style={styles.input}
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
              />

              <input
                style={styles.input}
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
              />

              <button style={styles.button} type="submit">
                Login
              </button>
            </form>

            {error && <p style={styles.error}>{error}</p>}

            <p style={styles.footerText}>
              Don&apos;t have an account?{" "}
              <Link to="/register" style={styles.link}>
                Register
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at top left, #1f3b73 0%, #0f172a 45%, #020617 100%)",
    color: "#ffffff",
  },

  overlay: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "40px",
    padding: "40px 70px",
    flexWrap: "wrap",
  },

  leftSection: {
    flex: "1",
    minWidth: "300px",
    maxWidth: "560px",
  },

  rightSection: {
    flex: "1",
    minWidth: "320px",
    display: "flex",
    justifyContent: "center",
  },

  logoBox: {
    width: "72px",
    height: "72px",
    borderRadius: "20px",
    background: "rgba(255,255,255,0.14)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "32px",
    marginBottom: "24px",
    backdropFilter: "blur(10px)",
  },

  logoBoxSmall: {
    width: "56px",
    height: "56px",
    borderRadius: "16px",
    background: "rgba(255,255,255,0.14)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "26px",
    margin: "0 auto 18px auto",
    backdropFilter: "blur(10px)",
  },

  mainTitle: {
    fontSize: "54px",
    lineHeight: "1.05",
    marginBottom: "16px",
    fontWeight: "700",
  },

  card: {
    width: "100%",
    maxWidth: "460px",
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.14)",
    borderRadius: "28px",
    padding: "36px 32px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
    backdropFilter: "blur(16px)",
  },

  cardTitle: {
    fontSize: "34px",
    textAlign: "center",
    marginBottom: "8px",
  },

  cardSubtitle: {
    textAlign: "center",
    color: "rgba(255,255,255,0.75)",
    marginBottom: "26px",
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },

  input: {
    width: "100%",
    padding: "14px 16px",
    borderRadius: "14px",
    border: "1px solid rgba(255,255,255,0.16)",
    background: "rgba(255,255,255,0.07)",
    color: "#ffffff",
    outline: "none",
  },

  button: {
    marginTop: "8px",
    padding: "14px",
    border: "none",
    borderRadius: "14px",
    background: "linear-gradient(90deg, #7c3aed 0%, #06b6d4 100%)",
    color: "#ffffff",
    fontWeight: "600",
    cursor: "pointer",
  },

  error: {
    color: "#fca5a5",
    marginTop: "14px",
    textAlign: "center",
  },

  footerText: {
    textAlign: "center",
    marginTop: "22px",
    color: "rgba(255,255,255,0.82)",
  },

  link: {
    color: "#67e8f9",
    fontWeight: "600",
  },
};

export default LoginPage;