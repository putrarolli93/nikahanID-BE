const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api'; // or check backend port

async function testAdminFlow() {
  try {
    console.log('🧪 Starting Admin & Analytics Verification...');

    // 1. Record sample page view
    console.log('1. Testing pageview tracking...');
    const trackRes = await axios.post(`${BASE_URL}/analytics/track`, {
      page_path: '/templates',
      visitor_id: 'test_visitor_123'
    });
    console.log('  Pageview track status:', trackRes.status, trackRes.data);

    // 2. Admin Login
    console.log('\n2. Testing Admin login (admin@nikahan.id / 5elamanya)...');
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@nikahan.id',
      password: '5elamanya'
    });

    console.log('  Login status:', loginRes.status, loginRes.data.message);
    const { token, user } = loginRes.data.data;
    console.log(`  User logged in: Name=${user.name}, Email=${user.email}, Role=${user.role}`);

    if (user.role !== 'admin') {
      throw new Error('User role is not admin!');
    }

    // 3. Fetch Admin Analytics
    console.log('\n3. Testing GET /api/admin/analytics...');
    const analyticsRes = await axios.get(`${BASE_URL}/admin/analytics`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('  Analytics data summary:', {
      totalVisits: analyticsRes.data.data.totalVisits,
      todayVisits: analyticsRes.data.data.todayVisits,
      todayUnique: analyticsRes.data.data.todayUnique,
      totalUsers: analyticsRes.data.data.totalUsers,
      popularPagesCount: analyticsRes.data.data.popularPages.length,
      dailyTrendCount: analyticsRes.data.data.dailyTrend.length,
    });

    // 4. Fetch Users List
    console.log('\n4. Testing GET /api/admin/users...');
    const usersRes = await axios.get(`${BASE_URL}/admin/users`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('  Users list count:', usersRes.data.data.length);

    console.log('\n🎉 ALL ADMIN VERIFICATION TESTS PASSED!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

testAdminFlow();
