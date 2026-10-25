require("dotenv").config();
const { sequelize } = require("./models");

const syncDatabase = async () => {
    try {
        console.log("Connecting to the database...");
        await sequelize.authenticate();
        console.log("Connection has been established successfully.");

        console.log("Syncing database models (alter: true)...");
        // Using alter: true will update the schema to match the models without dropping tables
        await sequelize.sync({ alter: true });
        console.log("Database synchronized successfully.");
        
        process.exit(0);
    } catch (error) {
        console.error("Unable to connect to the database or sync:", error);
        process.exit(1);
    }
};

syncDatabase();
