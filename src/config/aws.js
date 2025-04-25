const AWS = require('aws-sdk');
const dotenv = require('dotenv');

dotenv.config();

// Configure AWS SDK
AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});

// Create S3 service object
const s3 = new AWS.S3();

// Define upload parameters
const s3BucketName = 'emedihub-prescriptions';

// Create the bucket if it doesn't exist
const createBucketIfNotExists = async () => {
    try {
        await s3.headBucket({ Bucket: s3BucketName }).promise();
        console.log(`Bucket ${s3BucketName} already exists`);
    } catch (error) {
        if (error.code === 'NotFound' || error.code === 'NoSuchBucket') {
            try {
                await s3.createBucket({
                    Bucket: s3BucketName,
                    CreateBucketConfiguration: {
                        LocationConstraint: process.env.AWS_REGION
                    }
                }).promise();
                console.log(`Bucket ${s3BucketName} created successfully`);
            } catch (createError) {
                console.error(`Error creating bucket: ${createError.message}`);
            }
        } else {
            console.error(`Error checking bucket: ${error.message}`);
        }
    }
};

// Call the function to ensure bucket exists
createBucketIfNotExists();

module.exports = {
    s3,
    s3BucketName
}; 