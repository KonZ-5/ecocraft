// Menangkap semua error yang dilempar (next(err)) atau error tak tertangani di route
const errorHandler = (err, req, res, next) => {
    console.error(err.stack);

    const statusCode = err.statusCode || 500;
    const message = err.message || "Terjadi kesalahan pada server";

    res.status(statusCode).json({
        status: "error",
        message,
    });
};

export { errorHandler };
