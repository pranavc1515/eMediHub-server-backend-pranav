const axios = require('axios');

// Base URL for the patient microservice API
// const API_BASE_URL = "http://52.66.115.96:3000/user";
// const API_BASE_URL = 'https://devbackend.emedihub.com/user';
const API_BASE_URL = 'http://43.204.91.138:3000/user';

// Get user by ID (e.g., 243 or US243)
const getUserById = async (userId, authToken) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/get-user/${userId}`, {
      headers: {
        Authorization: authToken,
        Accept: 'application/json',
      },
    });

    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || 'Error fetching user by ID'
    );
  }
};

// Register a new patient
const registerNewPatient = async (phone) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/register-new`,
      { phone },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  } catch (error) {
    // If patient already exists, automatically trigger login flow
    if (
      error.response?.data?.message ===
      'User already registered with this phone number.'
    ) {
      const loginResponse = await doLogin(phone);
      return { ...loginResponse, patientExists: true };
    }
    throw new Error(
      error.response?.data?.message || 'Error registering patient'
    );
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
          'Content-Type': 'application/json',
        },
      }
    );

    // If OTP validation is successful, get profile details
    console.log(response.data.status && response.data.token);

    console.log('response.data', response.data);
    const profileDetails = await getProfileDetails(
      `Bearer ${response.data.token}`
    );
    const isProfileComplete = !!profileDetails?.data?.name;
    console.log('details', profileDetails);
    return {
      ...response.data,
      patient: {
        isProfileComplete,
      },
    };

    // return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Error validating OTP');
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
          'Content-Type': 'application/json',
        },
      }
    );
    console.log('checkUserExist', response);
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || 'Error checking patient existence'
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
          'Content-Type': 'application/json',
          Authorization: authToken,
        },
      }
    );

    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || 'Error updating personal details'
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
      error.response?.data?.message || 'Error fetching profile details'
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
      error.response?.data?.message || 'Error fetching medical details'
    );
  }
};

// Verify email
const verifyEmail = async (email, authToken, name = null) => {
  try {
    const requestBody = { email };
    if (name) {
      requestBody.name = name;
    }

    const response = await axios.put(
      `${API_BASE_URL}/email-verify`,
      requestBody,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: authToken,
        },
      }
    );

    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Error verifying email');
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
          'Content-Type': 'application/json',
          Authorization: authToken,
        },
      }
    );

    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || 'Error updating medical details'
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
          'Content-Type': 'application/json',
        },
      }
    );
    console.log('doLogin', response.data);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Error during login');
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
    throw new Error(
      error.response?.data?.message ||
      'Error fetching video consultation pricing'
    );
  }
};

// Get doctor price
const getDoctorPrice = async (doctorId, authToken) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/doctor-price/${doctorId}`,
      {
        headers: {
          Authorization: authToken,
        },
      }
    );

    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || 'Error fetching doctor price'
    );
  }
};

// Delete user account (soft delete)
const deleteUserAccount = async (authToken) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/do-delete-account`, {
      headers: {
        Authorization: authToken,
        Accept: 'application/json',
      },
    });

    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || 'Error deleting user account'
    );
  }
};

// Get about page content
const getAboutPage = async () => {
  try {
    const response = await axios.get(`http://43.204.91.138:3000/settings/about`, {
      headers: {
        Accept: 'application/json',
      },
    });

    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || 'Error fetching about page'
    );
  }
};

// Get terms page content
const getTermsPage = async () => {
  try {
    const response = await axios.get(`http://43.204.91.138:3000/settings/terms`, {
      headers: {
        Accept: 'application/json',
      },
    });

    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || 'Error fetching terms page'
    );
  }
};

// Update user's preferred language
const updateUserLanguage = async (language, authToken) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/language`,
      { language },
      {
        headers: {
          Authorization: authToken,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      }
    );

    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || 'Error updating user language'
    );
  }
};

module.exports = {
  getUserById,
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
  deleteUserAccount,
  getAboutPage,
  getTermsPage,
  updateUserLanguage,
};
