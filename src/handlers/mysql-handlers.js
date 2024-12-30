import { Customer, Order, sequelize, cleanupDatabase } from '../models/mysql';
import { Op } from 'sequelize';

// Vulnerable handlers for SQL injection examples
const mysqlHandlers = {
    // Vulnerable search endpoint using raw SQL query
    async searchCustomers(ctx) {
        const { query } = ctx.request.query;
        try {
            // Vulnerable: Direct string interpolation in SQL query
            const [results] = await sequelize.query(
                `SELECT * FROM Customers WHERE name LIKE '%${query}%' OR email LIKE '%${query}%'`
            );
            ctx.body = results;
        } catch (error) {
            ctx.status = 500;
            ctx.body = { error: error.message };
        }
    },

    // Vulnerable order creation with raw SQL
    async createOrder(ctx) {
        const { customer_id, amount, notes } = ctx.request.body;
        try {
            // Vulnerable: Direct string interpolation in SQL query
            const [result] = await sequelize.query(
                `INSERT INTO Orders (customer_id, amount, notes, status, createdAt, updatedAt)
         VALUES (${customer_id}, ${amount}, '${notes}', 'pending', NOW(), NOW())`
            );
            ctx.body = { id: result };
        } catch (error) {
            ctx.status = 500;
            ctx.body = { error: error.message };
        }
    },

    // Vulnerable customer credit check
    async checkCredit(ctx) {
        const { customer_id } = ctx.request.query;
        try {
            // Vulnerable: Direct string interpolation in SQL query
            const [result] = await sequelize.query(
                `SELECT credit_limit FROM Customers WHERE id = ${customer_id} LIMIT 1`
            );
            ctx.body = result[0] || { credit_limit: 0 };
        } catch (error) {
            ctx.status = 500;
            ctx.body = { error: error.message };
        }
    },

    // Safe handlers using Sequelize ORM (for comparison)
    async safeSearchCustomers(ctx) {
        const { query } = ctx.request.query;
        try {
            const results = await Customer.findAll({
                where: {
                    [Op.or]: [
                        { name: { [Op.like]: `%${query}%` } },
                        { email: { [Op.like]: `%${query}%` } }
                    ]
                }
            });
            ctx.body = results;
        } catch (error) {
            ctx.status = 500;
            ctx.body = { error: error.message };
        }
    },

    // Initialize sample data
    async initializeSampleData(ctx) {
        try {
            // Clean up existing data
            await cleanupDatabase();

            // Create sample customers
            await Customer.bulkCreate([
                { name: 'John Doe', email: 'john@example.com', credit_limit: 5000.00 },
                { name: 'Jane Smith', email: 'jane@example.com', credit_limit: 3000.00 },
                { name: 'Bob Wilson', email: 'bob@example.com', credit_limit: 2000.00 }
            ]);

            // Create sample orders
            await Order.bulkCreate([
                { customer_id: 1, amount: 1500.00, notes: 'First order' },
                { customer_id: 2, amount: 2500.00, notes: 'Priority delivery' },
                { customer_id: 3, amount: 1000.00, notes: 'Standard order' }
            ]);

            ctx.body = { message: 'Sample data initialized successfully' };
        } catch (error) {
            ctx.status = 500;
            ctx.body = { error: error.message };
        }
    }
};

export default mysqlHandlers;
