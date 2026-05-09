import { Sequelize } from 'sequelize';
import { config } from './env.js';

let databaseAvailable = false;

const sequelize = new Sequelize(
  config.database.name,
  config.database.user,
  config.database.password,
  {
    host: config.database.host,
    port: config.database.port,
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
        servername: config.database.host,
      },
      options: config.database.options || undefined,
    },
    logging: false,
  }
);

// Test the connection
const testConnection = async () => {
  try {
    console.log('Attempting database connection:', {
      host: config.database.host,
      port: config.database.port,
      database: config.database.name,
      user: config.database.user,
    });
    await sequelize.authenticate();
    databaseAvailable = true;
    console.log('Database connection has been established successfully.');
  } catch (error) {
    databaseAvailable = false;
    console.error('Unable to connect to the database:', error.message);
    console.error(error.stack);
  }
};

testConnection();

export const isDatabaseAvailable = () => databaseAvailable;
export default sequelize;