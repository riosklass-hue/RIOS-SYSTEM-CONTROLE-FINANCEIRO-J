
const mysql = require('mysql2');

const pool = mysql.createPool({
  host: 'localhost', // Geralmente localhost na Hostinger
  user: 'u123456789_rios', // Substitua pelo seu usuário MySQL
  password: 'sua_senha_secreta', // Substitua pela sua senha
  database: 'u123456789_rios_db', // Substitua pelo nome do seu banco
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool.promise();
