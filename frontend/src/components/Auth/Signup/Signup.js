import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "./Signup.css";

function Signup({ onSignup }) {
  const [name, setName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [popup, setPopup] = useState({ message: "", type: "" });
  const navigate = useNavigate();

  const showPopup = (message, type) => {
    setPopup({ message, type });
    setTimeout(() => setPopup({ message: "", type: "" }), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (mobileNumber.length !== 10) {
      showPopup("Mobile number must be 10 digits long.", "error");
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:5000/api/users/register",
        {
          username: name, // Include username
          mobileNumber,
          password,
          email: "", // Add email if needed
          role: "user", // Default role is 'user'
        }
      );

      if (response.status === 201) {
        showPopup("Signup successful! Logging in...", "success");

        // Automatically log in the user after successful signup
        const loginResponse = await axios.post(
          "http://localhost:5000/api/users/login",
          {
            mobileNumber,
            password,
          }
        );

        if (loginResponse.data.token && loginResponse.data.user) {
          localStorage.setItem("userToken", loginResponse.data.token);
          localStorage.setItem("userRole", loginResponse.data.user.role);
          localStorage.setItem("userId", loginResponse.data.user._id);
          localStorage.setItem("username", loginResponse.data.user.username);

          // Clear form fields
          setName("");
          setMobileNumber("");
          setPassword("");

          // Update App.js state and trigger navigation
          onSignup(loginResponse.data.user); 
        } else {
          showPopup("Invalid response from server during login", "error");
        }
      } else {
        showPopup("Invalid response from server", "error");
      }
    } catch (error) {
      console.error("Signup error:", error);
      let errorMessage = "Signup failed! Please try again.";
      if (error.response) {
        errorMessage = error.response.data.message || errorMessage;
      } else if (error.request) {
        errorMessage = "Cannot connect to the server. Please check your internet connection.";
      }
      showPopup(errorMessage, "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <form className="signup-form" onSubmit={handleSubmit}>
        {/* Name Input */}
        <div className="input__container input__container--name">
          <input
            type="text"
            className="input__search"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={isLoading}
          />
          <div className="shadow__input"></div>
        </div>

        {/* Mobile Number Input */}
        <div className="input__container input__container--phone">
          <input
            type="tel"
            className="input__search"
            placeholder="Enter your phone number"
            value={mobileNumber}
            onChange={(e) => setMobileNumber(e.target.value)}
            required
            disabled={isLoading}
            pattern="[0-9]{10}"
            maxLength="10"
          />
          <div className="shadow__input"></div>
        </div>

        {/* Password Input */}
        <div className="input__container input__container--password">
          <input
            type="password"
            className="input__search"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
            minLength="6"
          />
          <div className="shadow__input"></div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`signup-button ${isLoading ? "loading" : ""}`}
        >
          {isLoading ? "Signing up..." : "Sign Up"}
        </button>

        {/* Sign In Link */}
        <div className="signin-link">
          Already a member? <Link to="/login">Sign in</Link>
        </div>

        {/* Popup Message */}
        {popup.message && (
          <div className={`popup ${popup.type}`}>
            {popup.message}
          </div>
        )}
      </form>
    </div>
  );
}

export default Signup;