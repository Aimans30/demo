import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import "./Profile.css";
import Loader from '../Loader/Loader'; // Import the Loader component

const Profile = () => {
  const [profile, setProfile] = useState({
    username: "",
    mobileNumber: "",
    address: "",
    oldPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [loading, setLoading] = useState(true); // Added loading state
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true); // Show loader while fetching profile
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get("/api/users/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setProfile({
          username: response.data.username,
          mobileNumber: response.data.mobileNumber,
          address: response.data.address,
          oldPassword: "",
          newPassword: "",
          confirmNewPassword: "",
        });
      } catch (error) {
        console.error("Error fetching profile:", error.response ? error.response.data.message : error.message);
        setErrorMessage("Failed to load profile. Please try again.");
      } finally {
        setLoading(false); // Hide loader after fetching profile
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
    setLoading(true); // Show loader while updating profile

    try {
      const token = localStorage.getItem("token");
      const response = await axios.put(
        "/api/users/profile",
        {
          username: profile.username,
          mobileNumber: profile.mobileNumber,
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

      setSuccessMessage("Profile updated successfully.");
      setProfile({
        ...profile,
        oldPassword: "",
        newPassword: "",
        confirmNewPassword: "",
      });
    } catch (error) {
      console.error("Error updating profile:", error.response ? error.response.data.message : error.message);
      setErrorMessage("Failed to update profile. Please try again.");
    } finally {
      setLoading(false); // Hide loader after updating profile
    }
  };

  if (loading) {
    return <Loader />; // Show loader while loading
  }

  return (
    <div className="profile-container">
      <h2>Profile</h2>
      {successMessage && <p className="success-message">{successMessage}</p>}
      {errorMessage && <p className="error-message">{errorMessage}</p>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="username">User Name:</label>
          <input
            type="text"
            id="username"
            name="username"
            value={profile.username}
            onChange={handleChange}
            readOnly
            className="input"
            placeholder="Enter User Name"
          />
        </div>
        <div className="form-group">
          <label htmlFor="mobileNumber">Phone Number:</label>
          <input
            type="text"
            id="mobileNumber"
            name="mobileNumber"
            value={profile.mobileNumber}
            onChange={handleChange}
            readOnly
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
            className="input"
            placeholder="Enter Address"
          />
        </div>
        <div className="form-group password-group">
          <label htmlFor="oldPassword">Old Password:</label>
          <div className="password-input-container">
            <input
              type={showOldPassword ? "text" : "password"}
              id="oldPassword"
              name="oldPassword"
              value={profile.oldPassword}
              onChange={handleChange}
              className="input"
              placeholder="Enter Old Password"
              required
            />
            <span
              className="password-toggle-icon"
              onClick={() => setShowOldPassword(!showOldPassword)}
            >
              {showOldPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>
        </div>
        <div className="form-group password-group">
          <label htmlFor="newPassword">New Password:</label>
          <div className="password-input-container">
            <input
              type={showNewPassword ? "text" : "password"}
              id="newPassword"
              name="newPassword"
              value={profile.newPassword}
              onChange={handleChange}
              className="input"
              placeholder="Enter New Password"
              required
            />
            <span
              className="password-toggle-icon"
              onClick={() => setShowNewPassword(!showNewPassword)}
            >
              {showNewPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>
        </div>
        <div className="form-group password-group">
          <label htmlFor="confirmNewPassword">Confirm New Password:</label>
          <div className="password-input-container">
            <input
              type={showConfirmPassword ? "text" : "password"}
              id="confirmNewPassword"
              name="confirmNewPassword"
              value={profile.confirmNewPassword}
              onChange={handleChange}
              className="input"
              placeholder="Confirm New Password"
              required
            />
            <span
              className="password-toggle-icon"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>
        </div>
        <button type="submit" className="btn-save">
          Save Changes
        </button>
      </form>
    </div>
  );
};

export default Profile;