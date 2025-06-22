const Family = require('../models/family.model');
const { User } = require('../models/user.model');

const familySeedData = [
    {
        userId: '123e4567-e89b-12d3-a456-426614174000', // This should be a real user ID
        firstName: 'John',
        lastName: 'Doe',
        relationship: 'Father',
        dateOfBirth: '1970-05-15',
        gender: 'Male',
        phone: '1234567890',
        email: 'john.doe@example.com',
        bloodGroup: 'O+',
        medicalConditions: 'Hypertension',
        emergencyContact: true,
        notes: 'Primary emergency contact'
    },
    {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        firstName: 'Jane',
        lastName: 'Doe',
        relationship: 'Mother',
        dateOfBirth: '1975-08-22',
        gender: 'Female',
        phone: '0987654321',
        email: 'jane.doe@example.com',
        bloodGroup: 'A+',
        medicalConditions: 'Diabetes Type 2',
        emergencyContact: true,
        notes: 'Secondary emergency contact'
    },
    {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        firstName: 'Mike',
        lastName: 'Doe',
        relationship: 'Brother',
        dateOfBirth: '1995-12-10',
        gender: 'Male',
        phone: '5555555555',
        email: 'mike.doe@example.com',
        bloodGroup: 'B+',
        emergencyContact: false,
        notes: 'Lives in another city'
    },
    {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        firstName: 'Sarah',
        lastName: 'Doe',
        relationship: 'Sister',
        dateOfBirth: '1998-03-18',
        gender: 'Female',
        phone: '4444444444',
        email: 'sarah.doe@example.com',
        bloodGroup: 'AB-',
        medicalConditions: 'Allergic to peanuts',
        emergencyContact: false,
        notes: 'College student'
    }
];

const seedFamilyData = async () => {
    try {
        console.log('🌱 Starting family data seeding...');

        // Clear existing family data (optional)
        // await Family.destroy({ where: {}, force: true });
        // console.log('Cleared existing family data');

        // Insert family seed data
        const createdFamilyMembers = await Family.bulkCreate(familySeedData, {
            validate: true,
            ignoreDuplicates: true
        });

        console.log(`✅ Successfully seeded ${createdFamilyMembers.length} family members`);
        console.log('Family members created:');
        createdFamilyMembers.forEach(member => {
            console.log(`- ${member.firstName} ${member.lastName} (${member.relationship})`);
        });

    } catch (error) {
        console.error('❌ Error seeding family data:', error);
        throw error;
    }
};

const createSampleFamilyForUser = async (userId) => {
    try {
        console.log(`🌱 Creating sample family for user: ${userId}`);

        const sampleFamily = familySeedData.map(member => ({
            ...member,
            userId: userId
        }));

        const createdMembers = await Family.bulkCreate(sampleFamily, {
            validate: true,
            ignoreDuplicates: true
        });

        console.log(`✅ Created ${createdMembers.length} family members for user ${userId}`);
        return createdMembers;

    } catch (error) {
        console.error(`❌ Error creating sample family for user ${userId}:`, error);
        throw error;
    }
};

// Utility function to create relationships mapping
const getRelationshipOptions = () => {
    return [
        'Father',
        'Mother',
        'Spouse',
        'Brother',
        'Sister',
        'Son',
        'Daughter',
        'Other'
    ];
};

// Utility function to get blood group options
const getBloodGroupOptions = () => {
    return ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
};

// Utility function to get gender options
const getGenderOptions = () => {
    return ['Male', 'Female', 'Other'];
};

module.exports = {
    seedFamilyData,
    createSampleFamilyForUser,
    getRelationshipOptions,
    getBloodGroupOptions,
    getGenderOptions,
    familySeedData
}; 