import db from "../config/database.js";

export const addEcoPoints = (userId, points, callback = () => {}) => {
  const query = `
    UPDATE users
    SET eco_points = eco_points + ?
    WHERE id = ?
  `;

  db.query(query, [points, userId], callback);
};

export const subtractEcoPoints = (userId, points, callback = () => {}) => {
  const query = `
    UPDATE users
    SET eco_points = GREATEST(eco_points - ?, 0)
    WHERE id = ?
  `;

  db.query(query, [points, userId], callback);
};