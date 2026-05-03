import { useState } from 'react';
import DriversList from './DriversList';
import AddDriver from './AddDriver';
import DriverProfile from './DriverProfile';

function DriversPage() {
  const [view, setView] = useState('list');
  const [selectedDriver, setSelectedDriver] = useState(null);

  if (view === 'add') return <AddDriver onBack={() => setView('list')} />;
  if (view === 'profile') return <DriverProfile driver={selectedDriver} onBack={() => setView('list')} />;

  return (
    <DriversList
      onAddDriver={() => setView('add')}
      onViewDriver={(driver) => { setSelectedDriver(driver); setView('profile'); }}
    />
  );
}

export default DriversPage;
