const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('eMediHub', 'root', 'root', {
  host: 'localhost',
  dialect: 'mysql',
  dialectModule: require('mysql2'),  // Ensure Sequelize uses mysql2
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('Connection to MySQL database has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the MySQL database:', error);
  }
};

testConnection();
  
module.exports = sequelize;