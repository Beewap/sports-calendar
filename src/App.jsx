import { useState } from 'react';
import { DataProvider } from './contexts/DataContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Layout } from './components/Layout';
import Students from './pages/Students';
import Calendar from './pages/Calendar';
import Login from './pages/Login';

function AuthenticatedApp() {
  const [currentTab, setCurrentTab] = useState('calendar');
  const { user } = useAuth();

  if (!user) {
    return <Login />;
  }

  return (
    <DataProvider>
      <Layout currentTab={currentTab} onTabChange={setCurrentTab}>
        {currentTab === 'calendar' && <Calendar />}
        {currentTab === 'students' && <Students />}
      </Layout>
    </DataProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  );
}

export default App;
