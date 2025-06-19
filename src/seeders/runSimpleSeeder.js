const { seedAll } = require('./simpleDummyData');

// Run the seeders
(async () => {
    try {
        console.log('Starting data seeding process...');
        await seedAll();
        console.log('Data seeding completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error running seeders:', error);
        process.exit(1);
    }
})(); 