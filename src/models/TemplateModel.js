const db = require('../config/database');

class TemplateModel {
  static async getAll(filters = {}) {
    let query = `
      SELECT 
        id, name, slug, thumbnail_url, preview_url, preview_url_mobile, 
        category, is_premium, is_active, description, price, features,
        CASE WHEN is_premium = 1 THEN 'Premium' ELSE 'Gratis' END as price_type
      FROM templates 
      WHERE is_active = 1
    `;
    
    const queryParams = [];
    
    if (filters.category && filters.category !== 'Semua') {
      query += ` AND category = ?`;
      queryParams.push(filters.category);
    }
    
    if (filters.is_premium !== undefined) {
      query += ` AND is_premium = ?`;
      queryParams.push(filters.is_premium);
    }
    
    if (filters.search) {
      query += ` AND name LIKE ?`;
      queryParams.push(`%${filters.search}%`);
    }
    
    query += ` ORDER BY is_premium ASC, id ASC`;
    
    const [rows] = await db.execute(query, queryParams);
    return rows;
  }
  
  static async getById(id) {
    const query = `
      SELECT id, name, slug, thumbnail_url, preview_url, preview_url_mobile, category, is_premium, is_active, description, price, features
      FROM templates 
      WHERE id = ? AND is_active = 1
    `;
    const [rows] = await db.execute(query, [id]);
    return rows[0];
  }
  
  static async getBySlug(slug) {
    const query = `
      SELECT id, name, slug, thumbnail_url, preview_url, preview_url_mobile, category, is_premium, is_active, description, price, features
      FROM templates 
      WHERE slug = ? AND is_active = 1
    `;
    const [rows] = await db.execute(query, [slug]);
    return rows[0];
  }
  
  static async getCategories() {
    const query = `
      SELECT DISTINCT category 
      FROM templates 
      WHERE is_active = 1
      ORDER BY category
    `;
    const [rows] = await db.execute(query);
    return rows.map(row => row.category);
  }
  
  static async create(data) {
    const query = `
      INSERT INTO templates (name, slug, thumbnail_url, preview_url, preview_url_mobile, category, is_premium, is_active, description, price, features)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await db.execute(query, [
      data.name, data.slug, data.thumbnail_url, data.preview_url, data.preview_url_mobile,
      data.category, data.is_premium || 0, data.is_active || 1,
      data.description || null, data.price || 0,
      data.features ? JSON.stringify(data.features) : null
    ]);
    return result.insertId;
  }
  
  static async update(id, data) {
    const query = `
      UPDATE templates 
      SET name = ?, slug = ?, thumbnail_url = ?, preview_url = ?, preview_url_mobile = ?,
          category = ?, is_premium = ?, is_active = ?,
          description = ?, price = ?, features = ?
      WHERE id = ?
    `;
    const [result] = await db.execute(query, [
      data.name, data.slug, data.thumbnail_url, data.preview_url, data.preview_url_mobile,
      data.category, data.is_premium, data.is_active,
      data.description || null, data.price || 0,
      data.features ? JSON.stringify(data.features) : null,
      id
    ]);
    return result.affectedRows > 0;
  }
  
  static async delete(id) {
    const query = `DELETE FROM templates WHERE id = ?`;
    const [result] = await db.execute(query, [id]);
    return result.affectedRows > 0;
  }
}

module.exports = TemplateModel;