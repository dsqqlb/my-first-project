import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

interface UserInfo {
  loginName: string;
  employeeName: string;
  employeeNo: string;
}

export default function MenuPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }

    const userStr = localStorage.getItem('user');
    if (userStr) {
      setUser(JSON.parse(userStr));
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  if (!user) return null;

  return (
    <div style={{ minHeight: '100vh', padding: '40px 20px' }}>
      <div className="container">
        <div className="card">
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '30px',
            paddingBottom: '20px',
            borderBottom: '2px solid #f0f0f0'
          }}>
            <div>
              <h1 style={{ 
                fontSize: '28px', 
                marginBottom: '10px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                HRMS 主菜单
              </h1>
              <p style={{ color: '#666', fontSize: '14px' }}>
                欢迎回来，{user.employeeName} ({user.employeeNo})
              </p>
            </div>
            <button onClick={handleLogout} className="btn btn-secondary">
              退出登录
            </button>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '20px',
            marginTop: '30px'
          }}>
            <div 
              className="menu-card"
              onClick={() => router.push('/users')}
              style={{
                padding: '30px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '12px',
                color: 'white',
                cursor: 'pointer',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(102, 126, 234, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ fontSize: '40px', marginBottom: '15px' }}>👥</div>
              <h3 style={{ fontSize: '20px', marginBottom: '10px' }}>用户管理</h3>
              <p style={{ fontSize: '14px', opacity: 0.9 }}>
                查看、添加、编辑和删除用户信息
              </p>
            </div>

            <div 
              className="menu-card"
              style={{
                padding: '30px',
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                borderRadius: '12px',
                color: 'white',
                cursor: 'pointer',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                opacity: 0.6
              }}
            >
              <div style={{ fontSize: '40px', marginBottom: '15px' }}>📊</div>
              <h3 style={{ fontSize: '20px', marginBottom: '10px' }}>数据统计</h3>
              <p style={{ fontSize: '14px', opacity: 0.9 }}>
                查看系统数据统计和报表（开发中）
              </p>
            </div>

            <div 
              className="menu-card"
              style={{
                padding: '30px',
                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                borderRadius: '12px',
                color: 'white',
                cursor: 'pointer',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                opacity: 0.6
              }}
            >
              <div style={{ fontSize: '40px', marginBottom: '15px' }}>⚙️</div>
              <h3 style={{ fontSize: '20px', marginBottom: '10px' }}>系统设置</h3>
              <p style={{ fontSize: '14px', opacity: 0.9 }}>
                配置系统参数和权限（开发中）
              </p>
            </div>
          </div>

          <div style={{ 
            marginTop: '40px', 
            padding: '20px', 
            background: '#f8f9fa', 
            borderRadius: '8px' 
          }}>
            <h3 style={{ marginBottom: '10px', fontSize: '16px' }}>系统信息</h3>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>
              当前用户：{user.loginName}
            </p>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>
              员工姓名：{user.employeeName}
            </p>
            <p style={{ fontSize: '14px', color: '#666' }}>
              员工编号：{user.employeeNo}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
