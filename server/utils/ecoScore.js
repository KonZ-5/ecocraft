import db from "../config/database.js";

// CO2 yang dihemat = berat limbah (kg) x faktor konversi kategori limbah
const calculateCarbonSaved = (wasteWeightKg, carbonFactor) => {
    return parseFloat((parseFloat(wasteWeightKg) * parseFloat(carbonFactor)).toFixed(2));
};

// Hitung ulang total_waste_kg & eco_score pengrajin berdasarkan:
// - total berat limbah dari semua produk yang dibuat
// - total berat limbah dari semua donasi yang sudah diterima (status = 'diterima')
// Dipanggil setiap kali ada produk baru/diubah/dihapus, atau donasi dikonfirmasi diterima
const recalculatePengrajinEcoScore = (pengrajinId, callback) => {
    const query = `
        UPDATE pengrajin_profiles
        SET
            total_waste_kg = (
                COALESCE((SELECT SUM(waste_weight_kg) FROM products WHERE pengrajin_id = ?), 0)
                + COALESCE((SELECT SUM(actual_weight) FROM waste_donations WHERE pengrajin_id = ? AND status = 'diterima'), 0)
            ),
            eco_score = (
                COALESCE((SELECT SUM(waste_weight_kg) FROM products WHERE pengrajin_id = ?), 0)
                + COALESCE((SELECT SUM(actual_weight) FROM waste_donations WHERE pengrajin_id = ? AND status = 'diterima'), 0)
            )
        WHERE id = ?
    `;
    db.query(query, [pengrajinId, pengrajinId, pengrajinId, pengrajinId, pengrajinId], (err, result) => {
        if (callback) callback(err, result);
    });
};

export { calculateCarbonSaved, recalculatePengrajinEcoScore };
