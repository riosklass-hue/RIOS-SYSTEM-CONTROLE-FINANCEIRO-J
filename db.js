
import mysql from 'mysql2';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'u123456789_rios', // <--- Verifique se é o mesmo da Hostinger
  password: process.env.DB_PASSWORD || 'sua_senha', 
  database: process.env.DB_NAME || 'u123456789_rios_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export default pool.promise();
