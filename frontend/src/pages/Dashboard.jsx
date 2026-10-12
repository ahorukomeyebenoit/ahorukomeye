import { useAuth } from '../context/AuthContext';
import Layout from '../components/layout/Layout';
import AdminDashboard from './AdminDashboard';
import ManagerDashboard from './ManagerDashboard';
import TenantDashboard from './TenantDashboard';

const Dashboard = () => {
  const { isAdmin, isManager, isTenant } = useAuth();

  return (
    <Layout>
      {isAdmin && <AdminDashboard />}
      {isManager && <ManagerDashboard />}
      {isTenant && <TenantDashboard />}
    </Layout>
  );
};

export default Dashboard;