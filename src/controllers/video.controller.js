const twilio = require("twilio");

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const apiKey = process.env.TWILIO_API_KEY;
const apiSecret = process.env.TWILIO_API_SECRET;
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;

const generateToken = async (req, res) => {
  try {
    const { roomName } = req.body;
    // Use authenticated user's information or fallback to provided identity
    const identity = req.user ? req.user.id : req.body.identity;

    const AccessToken = twilio.jwt.AccessToken;
    const VideoGrant = AccessToken.VideoGrant;

    const token = new AccessToken(accountSid, apiKey, apiSecret, {
      identity: identity.toString(),
    });

    const videoGrant = new VideoGrant({
      room: roomName,
    });

    token.addGrant(videoGrant);

    res.status(200).json({
      success: true,
      token: token.toJwt(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error generating token",
      error: error.message,
    });
  }
};

const createRoom = async (req, res) => {
  try {
    const client = twilio(accountSid, twilioAuthToken);
    const { roomName } = req.body;

    console.log("roomName", roomName);
    const room = await client.video.v1.rooms.create({
      uniqueName: roomName,
      type: "group",
    });
    console.log("room", room);
    res.status(200).json({
      success: true,
      room,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating room",
      error: error.message,
    });
  }
};

/**
 * List all video rooms
 */
const listRooms = async (req, res) => {
  try {
    const client = twilio(accountSid, apiKey, apiSecret);
    const { status } = req.query;

    let rooms;
    if (status) {
      rooms = await client.video.v1.rooms.list({ status });
    } else {
      rooms = await client.video.v1.rooms.list();
    }

    res.status(200).json({
      success: true,
      rooms,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching rooms",
      error: error.message,
    });
  }
};

/**
 * Get details of a specific room
 */
const getRoom = async (req, res) => {
  try {
    const client = twilio(accountSid, apiKey, apiSecret);
    const { roomSid } = req.params;

    const room = await client.video.v1.rooms(roomSid).fetch();

    res.status(200).json({
      success: true,
      room,
    });
  } catch (error) {
    // Check if error is because room not found
    if (error.status === 404) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    res.status(500).json({
      success: false,
      message: "Error fetching room details",
      error: error.message,
    });
  }
};

/**
 * End a room manually
 */
const completeRoom = async (req, res) => {
  try {
    const client = twilio(accountSid, apiKey, apiSecret);
    const { roomSid } = req.params;

    const room = await client.video.v1
      .rooms(roomSid)
      .update({ status: "completed" });

    res.status(200).json({
      success: true,
      room,
      message: "Room completed successfully",
    });
  } catch (error) {
    // Check if error is because room not found
    if (error.status === 404) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    res.status(500).json({
      success: false,
      message: "Error completing room",
      error: error.message,
    });
  }
};

/**
 * List all participants in a room
 */
const listParticipants = async (req, res) => {
  try {
    const client = twilio(accountSid, apiKey, apiSecret);
    const { roomSid } = req.params;

    // First check if room exists
    try {
      await client.video.v1.rooms(roomSid).fetch();
    } catch (error) {
      if (error.status === 404) {
        return res.status(404).json({
          success: false,
          message: "Room not found",
        });
      }
      throw error;
    }

    // Get participants
    const participants = await client.video.v1
      .rooms(roomSid)
      .participants.list();

    res.status(200).json({
      success: true,
      participants,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching participants",
      error: error.message,
    });
  }
};

/**
 * Disconnect a participant from a room
 */
const disconnectParticipant = async (req, res) => {
  try {
    const client = twilio(accountSid, apiKey, apiSecret);
    const { roomSid, participantSid } = req.params;

    // First check if room exists
    try {
      await client.video.v1.rooms(roomSid).fetch();
    } catch (error) {
      if (error.status === 404) {
        return res.status(404).json({
          success: false,
          message: "Room not found",
        });
      }
      throw error;
    }

    // Disconnect participant
    await client.video.v1
      .rooms(roomSid)
      .participants(participantSid)
      .update({ status: "disconnected" });

    res.status(200).json({
      success: true,
      message: "Participant disconnected successfully",
    });
  } catch (error) {
    // Check if error is because participant not found
    if (error.status === 404) {
      return res.status(404).json({
        success: false,
        message: "Participant not found",
      });
    }

    res.status(500).json({
      success: false,
      message: "Error disconnecting participant",
      error: error.message,
    });
  }
};

module.exports = {
  generateToken,
  createRoom,
  listRooms,
  getRoom,
  completeRoom,
  listParticipants,
  disconnectParticipant,
};
