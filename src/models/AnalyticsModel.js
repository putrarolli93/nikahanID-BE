const db = require('../config/database');

class AnalyticsModel {
  static async recordPageView({ page_path, visitor_id, user_agent, ip_address }) {
    const query = `
      INSERT INTO site_analytics (page_path, visitor_id, user_agent, ip_address)
      VALUES (?, ?, ?, ?)
    `;
    const [result] = await db.execute(query, [
      page_path || '/',
      visitor_id || 'anonymous',
      user_agent || null,
      ip_address || null
    ]);
    return result.insertId;
  }

  static async getSummary() {
    // Total visitors (pageviews)
    const [[totalVisitsRow]] = await db.execute('SELECT COUNT(*) as count FROM site_analytics');
    const totalVisits = totalVisitsRow ? totalVisitsRow.count : 0;

    // Today visitors
    const [[todayVisitsRow]] = await db.execute(
      'SELECT COUNT(*) as count FROM site_analytics WHERE DATE(created_at) = CURRENT_DATE()'
    );
    const todayVisits = todayVisitsRow ? todayVisitsRow.count : 0;

    // Unique visitors today
    const [[todayUniqueRow]] = await db.execute(
      'SELECT COUNT(DISTINCT visitor_id) as count FROM site_analytics WHERE DATE(created_at) = CURRENT_DATE()'
    );
    const todayUnique = todayUniqueRow ? todayUniqueRow.count : 0;

    // Total unique visitors all-time
    const [[totalUniqueRow]] = await db.execute(
      'SELECT COUNT(DISTINCT visitor_id) as count FROM site_analytics'
    );
    const totalUnique = totalUniqueRow ? totalUniqueRow.count : 0;

    // Total registered users
    const [[totalUsersRow]] = await db.execute('SELECT COUNT(*) as count FROM users');
    const totalUsers = totalUsersRow ? totalUsersRow.count : 0;

    // Total invitations created
    const [[totalInvitationsRow]] = await db.execute('SELECT COUNT(*) as count FROM wedding_info');
    const totalInvitations = totalInvitationsRow ? totalInvitationsRow.count : 0;

    // Popular pages
    const [popularPages] = await db.execute(`
      SELECT page_path, COUNT(*) as visit_count 
      FROM site_analytics 
      GROUP BY page_path 
      ORDER BY visit_count DESC 
      LIMIT 8
    `);

    // Daily trend last 7 days
    const [dailyTrend] = await db.execute(`
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m-%d') as date, 
        COUNT(*) as views, 
        COUNT(DISTINCT visitor_id) as unique_visitors 
      FROM site_analytics 
      WHERE created_at >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d') 
      ORDER BY date ASC
    `);

    // Recent activity log
    const [recentActivity] = await db.execute(`
      SELECT id, page_path, visitor_id, created_at 
      FROM site_analytics 
      ORDER BY id DESC 
      LIMIT 10
    `);

    return {
      totalVisits,
      todayVisits,
      todayUnique,
      totalUnique,
      totalUsers,
      totalInvitations,
      popularPages,
      dailyTrend,
      recentActivity
    };
  }
}

module.exports = AnalyticsModel;
