import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import ScheduleScreen from './components/ScheduleScreen.jsx';
import PlacesScreen from './components/PlacesScreen.jsx';
import PlaceDetailScreen from './components/PlaceDetailScreen.jsx';
import BottomTabBar from './components/BottomTabBar.jsx';

function Shell() {
  const location = useLocation();
  const showTabBar = location.pathname === '/' || location.pathname === '/lugares';

  return (
    <>
      <Routes>
        <Route path="/" element={<ScheduleScreen />} />
        <Route path="/lugares" element={<PlacesScreen />} />
        <Route path="/lugares/:id" element={<PlaceDetailScreen />} />
      </Routes>
      {showTabBar && <BottomTabBar />}
    </>
  );
}

export default function App() {
  return (
    <div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100dvh', position: 'relative' }}>
      <HashRouter>
        <Shell />
      </HashRouter>
    </div>
  );
}
