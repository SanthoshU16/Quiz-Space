const sql = require('mssql');

const config = {
    user: "thinkbit",
    password: "Virtual@3908",
    server: "103.207.1.91",
    database: "thinkbit",
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

console.log('DB CONFIG IN USE:', config);

const poolPromise = new sql.ConnectionPool(config)
    .connect()
    .then(pool => {
        console.log('Connected to SQL Server');
        return pool;
    })
    .catch(err => console.log('Database connection failed:', err));

module.exports = { sql, poolPromise };
