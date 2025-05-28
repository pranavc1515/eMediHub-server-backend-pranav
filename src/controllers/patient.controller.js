const axios = require("axios");

// Base URL for the 3rd party API
// const API_BASE_URL = "http://52.66.115.96:3000/user";
const API_BASE_URL = "https://devbackend.emedihub.com/user";

// Register a new patient
const registerNewPatient = async (phone) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/register-new`,
      { phone },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error) {
    // If patient already exists, automatically trigger login flow
    if (
      error.response?.data?.message ===
      "User already registered with this phone number."
    ) {
      const loginResponse = await doLogin(phone);
      return { ...loginResponse, patientExists: true };
    }
    throw new Error(error.response?.data?.message || "Error registering patient");
  }
};

// Validate OTP
const validateOTP = async (phone, otp) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/validate-otp`,
      { phone, otp },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    // If OTP validation is successful, get profile details
    console.log(response.data.status && response.data.token);

    console.log("response.data", response.data);
    const profileDetails = await getProfileDetails(
      `Bearer ${response.data.token}`
    );
    console.log("details", profileDetails);
    return {
      ...response.data,
      patient: profileDetails.data,
    };

    // return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error validating OTP");
  }
};

// Check if patient exists
const checkUserExists = async (phone) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/checkUserExist`,
      { phone },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    console.log("checkUserExist", response);
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Error checking patient existence"
    );
  }
};

// Record personal details
const recordPersonalDetails = async (patientData, authToken) => {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/record-personal-details`,
      patientData,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: authToken,
        },
      }
    );

    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Error updating personal details"
    );
  }
};

// Get profile details
const getProfileDetails = async (authToken) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/profile-details`, {
      headers: {
        Authorization: authToken,
      },
    });

    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Error fetching profile details"
    );
  }
};

// Get medical details
const getMedicalDetails = async (authToken) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/medical-details`, {
      headers: {
        Authorization: authToken,
      },
    });

    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Error fetching medical details"
    );
  }
};

// Verify email
const verifyEmail = async (email, authToken) => {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/email-verify`,
      { email },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: authToken,
        },
      }
    );

    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error verifying email");
  }
};

// Update medical details
const updateMedicalDetails = async (medicalData, authToken) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/medical-details`,
      medicalData,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: authToken,
        },
      }
    );

    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Error updating medical details"
    );
  }
};

// Login patient
const doLogin = async (username) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/do-login`,
      { username },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    console.log("doLogin", response.data);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error during login");
  }
};

// Get video consultation pricing
const getVideoConsultationPricing = async (authToken) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/video-price`, {
      headers: {
        Authorization: authToken,
      },
    });

    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error fetching video consultation pricing");
  }
};

// Get doctor price
const getDoctorPrice = async (doctorId, authToken) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/doctor-price/${doctorId}`, {
      headers: {
        Authorization: authToken,
      },
    });

    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error fetching doctor price");
  }
};

module.exports = {
  registerNewPatient,
  validateOTP,
  checkUserExists,
  recordPersonalDetails,
  getProfileDetails,
  getMedicalDetails,
  verifyEmail,
  updateMedicalDetails,
  doLogin,
  getVideoConsultationPricing,
  getDoctorPrice,
};
