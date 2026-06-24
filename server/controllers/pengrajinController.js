import db from "../config/database.js";

export const getVerifiedPengrajin = (req, res) => {
  const query = `
    SELECT
      pp.id,
      pp.workshop_name,
      u.name,
      pp.eco_score,
      pp.is_verified
    FROM pengrajin_profiles pp
    JOIN users u
      ON pp.user_id = u.id
    WHERE pp.is_verified = TRUE
    ORDER BY pp.workshop_name ASC
  `;

  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({
        status: "error",
        message: err.message,
      });
    }

    return res.status(200).json({
      status: "success",
      data: results,
    });
  });
};