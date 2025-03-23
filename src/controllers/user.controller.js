const axios = require('axios');

// Base URL for the 3rd party API
const API_BASE_URL = 'https://devbackend.emedihub.com/user';

// Register a new user
const registerNewUser = async (phone) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/register-new`, { phone }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Error registering user');
  }
};

// Validate OTP
const validateOTP = async (phone, otp) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/validate-otp`, { phone, otp }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Error validating OTP');
  }
};

// Check if user exists
const checkUserExists = async (phone) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/checkUserExist`, { phone }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Error checking user existence');
  }
};

// Record personal details
const recordPersonalDetails = async (userData, authToken) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/record-personal-details`, userData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authToken
      }
    });
    
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Error updating personal details');
  }
};

// Get profile details
const getProfileDetails = async (authToken) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/profile-details`, {
      headers: {
        'Authorization': authToken
      }
    });
    
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Error fetching profile details');
  }
};

// Get medical details
const getMedicalDetails = async (authToken) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/medical-details`, {
      headers: {
        'Authorization': authToken
      }
    });
    
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Error fetching medical details');
  }
};

// Verify email
const verifyEmail = async (email, authToken) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/email-verify`, { email }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authToken
      }
    });
    
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Error verifying email');
  }
};

// Update medical details
const updateMedicalDetails = async (medicalData, authToken) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/medical-details`, medicalData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authToken
      }
    });
    
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Error updating medical details');
  }
};

// Login user
const doLogin = async (username) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/do-login`, { username }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Error during login');
  }
};

module.exports = {
  registerNewUser,
  validateOTP,
  checkUserExists,
  recordPersonalDetails,
  getProfileDetails,
  getMedicalDetails,
  verifyEmail,
  updateMedicalDetails,
  doLogin
}; 