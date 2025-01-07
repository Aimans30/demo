import React, { useState, useEffect } from "react";
import axios from "axios";
import "./Profile.css";

const Profile = () => {
  const [profile, setProfile] = useState({
    fullName: "",
    phoneNumber: "",
    address: "",
    oldPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    // Fetch the user profile on component mount
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get("/api/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setProfile({
          fullName: response.data.fullName,
          phoneNumber: response.data.phoneNumber,
          address: response.data.address,
          oldPassword: "",
          newPassword: "",
          confirmNewPassword: "",
        });
        setLoading(false);
      } catch (error) {
        console.error("Error fetching profile:", error.message);
        setErrorMessage("Failed to load profile. Please try again.");
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prevProfile) => ({ ...prevProfile, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage("");
    setErrorMessage("");

    // Password validation (frontend)
    if (profile.newPassword !== profile.confirmNewPassword) {
      setErrorMessage("New password and confirm new password do not match.");
      return;
    }

    if (profile.newPassword) {
      if (!/(?=.*[A-Z])(?=.*\d)/.test(profile.newPassword)) {
        setErrorMessage(
          "New password must contain at least one capital letter and one number."
        );
        return;
      }
    }

    try {
      const token = localStorage.getItem("token");
      const response = await axios.put(
        "/api/profile",
        {
          fullName: profile.fullName,
          phoneNumber: profile.phoneNumber,
          address: profile.address,
          oldPassword: profile.oldPassword,
          newPassword: profile.newPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Check for password error from the backend
      if (response.data.error === "Incorrect old password") {
        setErrorMessage("Incorrect old password.");
        return;
      }

      setSuccessMessage("Profile updated successfully.");
      setProfile({
        ...profile,
        oldPassword: "",
        newPassword: "",
        confirmNewPassword: "",
      });
    } catch (error) {
      console.error("Error updating profile:", error.message);
      setErrorMessage("Failed to update profile. Please try again.");
    }
  };

  if (loading) {
    return <div className="profile-container">Loading...</div>;
  }

  return (
    <div className="profile-container">
      <h2>Profile</h2>
      {successMessage && <p className="success-message">{successMessage}</p>}
      {errorMessage && <p className="error-message">{errorMessage}</p>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="fullName">Full Name:</label>
          <input
            type="text"
            id="fullName"
            name="fullName"
            value={profile.fullName}
            onChange={handleChange}
            required
            className="input"
            placeholder="Enter Full Name"
          />
        </div>
        <div className="form-group">
          <label htmlFor="phoneNumber">Phone Number:</label>
          <input
            type="text"
            id="phoneNumber"
            name="phoneNumber"
            value={profile.phoneNumber}
            onChange={handleChange}
            required
            className="input"
            placeholder="Enter Phone Number"
          />
        </div>
        <div className="form-group">
          <label htmlFor="address">Address:</label>
          <input
            type="text"
            id="address"
            name="address"
            value={profile.address}
            onChange={handleChange}
            required
            className="input"
            placeholder="Enter Address"
          />
        </div>
        <div className="form-group">
          <label htmlFor="oldPassword">Old Password:</label>
          <input
            type="password"
            id="oldPassword"
            name="oldPassword"
            value={profile.oldPassword}
            onChange={handleChange}
            required
            className="input"
            placeholder="Enter Old Password"
          />
        </div>
        <div className="form-group">
          <label htmlFor="newPassword">New Password:</label>
          <input
            type="password"
            id="newPassword"
            name="newPassword"
            value={profile.newPassword}
            onChange={handleChange}
            className="input"
            placeholder="Enter New Password"
          />
        </div>
        <div className="form-group">
          <label htmlFor="confirmNewPassword">Confirm New Password:</label>
          <input
            type="password"
            id="confirmNewPassword"
            name="confirmNewPassword"
            value={profile.confirmNewPassword}
            onChange={handleChange}
            className="input"
            placeholder="Confirm New Password"
          />
        </div>
        <button type="submit" className="btn-save">
          Save Changes
        </button>
      </form>
    </div>
  );
};

export default Profile;