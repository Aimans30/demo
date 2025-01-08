import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Login.css";
import Loader from '../../Loader/Loader'; // Import the Loader component

function Login({ onLogin }) {
  const [mobileNumber, setMobileNumber] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [popup, setPopup] = useState({ message: "", type: "" });
  const navigate = useNavigate();

  const showPopup = (message, type) => {
    setPopup({ message, type });
    setTimeout(() => setPopup({ message: "", type: "" }), 3000);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);

    if (mobileNumber.length !== 10) {
      showPopup("Mobile number must be 10 digits long.", "error");
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post("http://localhost:5000/api/users/login", {
        mobileNumber,
        password,
      });

      if (response.data.token && response.data.user) {
        localStorage.setItem("userToken", response.data.token);
        localStorage.setItem("userRole", response.data.user.role || "user");
        localStorage.setItem("userId", response.data.user._id);
        localStorage.setItem("username", response.data.user.username);

        showPopup(response.data.message || "Login successful!", "success");

        setMobileNumber("");
        setPassword("");

        onLogin({ mobileNumber, password });
        navigate("/");
      } else {
        showPopup("Invalid response from server", "error");
      }
    } catch (error) {
      console.error("Login error:", error);
      let errorMessage = "Login failed! Please try again.";
      if (error.response) {
        switch (error.response.status) {
          case 400:
            errorMessage = "Please check your mobile number and password.";
            break;
          case 401:
            errorMessage = "Invalid mobile number or password.";
            break;
          case 404:
            errorMessage = "Account not found. Please sign up first.";
            break;
          case 500:
            errorMessage = "Server error. Please try again later.";
            break;
          default:
            errorMessage =
              error.response.data.message || "An error occurred during login.";
        }
      } else if (error.request) {
        errorMessage =
          "Cannot connect to the server. Please check your internet connection.";
      }

      showPopup(errorMessage, "error");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <Loader />;
  }

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        <div className="title">Welcome,<br /><span>sign in to continue</span></div>

        <div className="input__container">
          <input
            type="tel"
            className="input__search"
            placeholder="Phone Number"
            value={mobileNumber}
            onChange={(e) => setMobileNumber(e.target.value)}
            required
            disabled={isLoading}
            pattern="[0-9]{10}"
            maxLength="10"
          />
        </div>

        <div className="input__container">
          <input
            type="password"
            className="input__search"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
            minLength="6"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="login-button"
        >
          {isLoading ? "Logging in..." : "Login"}
        </button>

        <div className="signup-link">
          Don't have an account? <a href="/signup">Sign up</a>
        </div>

        {popup.message && (
          <div className={`popup ${popup.type}`}>
            {popup.message}
          </div>
        )}
      </form>
    </div>
  );
}

export default Login;