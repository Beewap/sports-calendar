import { useState } from 'react';
import { DataProvider } from './contexts/DataContext';
import { Layout } from './components/Layout';
import Students from './pages/Students';
import Calendar from './pages/Calendar';

// Placeholder for Calendar until implemented
function CalendarPlaceholder() {
  return (
    <div className="text-center py-20">
      <h2 className="text-2xl text-muted">Calendar View Coming Soon</h2>
    </div>
  );
}

function App() {
  const [currentTab, setCurrentTab] = useState('calendar');

  return (
    <DataProvider>
      <Layout currentTab={currentTab} onTabChange={setCurrentTab}>
        {currentTab === 'calendar' && <Calendar />}
        {currentTab === 'students' && <Students />}
      </Layout>
    </DataProvider>
  );
}

export default App;
