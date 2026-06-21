import mysql2 from "mysql2";
import dotenv from "dotenv";

dotenv.config();

// Menggunakan pool (bukan single connection) supaya tahan terhadap
// banyak request bersamaan saat testing concurrency (mis. via k6 / Postman Runner)
const pool = mysql2.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

pool.getConnection((err, connection) => {
    if (err) {
        console.error("Gagal koneksi database:", err.message);
    } else {
        console.log("Database ecocraft_db berhasil terhubung!");
        connection.release();
    }
});

// Versi promise dari pool - dipakai untuk operasi yang butuh transaction (mis. checkout order)
const promisePool = pool.promise();

export default pool;
export { promisePool };
