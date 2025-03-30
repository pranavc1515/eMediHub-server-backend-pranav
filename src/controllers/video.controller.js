const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const apiKey = process.env.TWILIO_API_KEY;
const apiSecret = process.env.TWILIO_API_SECRET;

const generateToken = async (req, res) => {
    try {
        const { roomName } = req.body;
        // Use authenticated user's information or fallback to provided identity
        const identity = req.user ? req.user.id : req.body.identity;
        
        const AccessToken = twilio.jwt.AccessToken;
        const VideoGrant = AccessToken.VideoGrant;

        const token = new AccessToken(
            accountSid,
            apiKey,
            apiSecret,
            { identity: identity.toString() }
        );

        const videoGrant = new VideoGrant({
            room: roomName
        });

        token.addGrant(videoGrant);

        res.status(200).json({
            success: true,
            token: token.toJwt()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error generating token',
            error: error.message
        });
    }
};

const createRoom = async (req, res) => {
    try {
        const client = twilio(accountSid, apiSecret);
        const { roomName } = req.body;

        const room = await client.video.v1.rooms.create({
            uniqueName: roomName,
            type: 'group'
        });

        res.status(200).json({
            success: true,
            room
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating room',
            error: error.message
        });
    }
};

module.exports = {
    generateToken,
    createRoom
}; 