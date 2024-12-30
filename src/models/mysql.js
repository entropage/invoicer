import { Sequelize, DataTypes } from 'sequelize';

// Initialize Sequelize with MySQL connection
const sequelize = new Sequelize({
    dialect: 'mysql',
    host: process.env.MYSQL_HOST || 'localhost',
    port: process.env.MYSQL_PORT || 3306,
    username: process.env.MYSQL_USER || 'invoicer',
    password: process.env.MYSQL_PASSWORD || 'invoicer123',
    database: process.env.MYSQL_DATABASE || 'invoicer',
    logging: false,
    dialectOptions: {
        supportBigNumbers: true,
        bigNumberStrings: true
    },
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
});

// Define Customer model (vulnerable to SQL injection)
const Customer = sequelize.define('Customer', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    credit_limit: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 1000.00,
    },
});

// Define Order model (vulnerable to SQL injection)
const Order = sequelize.define('Order', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    customer_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected'),
        defaultValue: 'pending',
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
});

// Define relationships
Customer.hasMany(Order, { foreignKey: 'customer_id' });
Order.belongsTo(Customer, { foreignKey: 'customer_id' });

// Clean up existing data
const cleanupDatabase = async () => {
    try {
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
        await Order.destroy({ where: {}, truncate: true, force: true });
        await Customer.destroy({ where: {}, truncate: true, force: true });
        await sequelize.query('ALTER TABLE Customers AUTO_INCREMENT = 1');
        await sequelize.query('ALTER TABLE Orders AUTO_INCREMENT = 1');
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
        console.log('Database cleaned up successfully');
    } catch (error) {
        console.error('Error cleaning up database:', error);
    }
};

// Sync models with database
const initializeDatabase = async () => {
    try {
        await sequelize.sync();
        await cleanupDatabase();
        console.log('MySQL database synchronized successfully');
    } catch (error) {
        console.error('Error synchronizing MySQL database:', error);
    }
};

export {
    sequelize,
    Customer,
    Order,
    initializeDatabase,
    cleanupDatabase,
};
