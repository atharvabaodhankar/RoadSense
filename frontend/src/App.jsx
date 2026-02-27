import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';

// Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import Upload from './pages/Upload';
import Dashboard from './pages/Dashboard';
import MapPage from './pages/MapPage';
import InspectionDetail from './pages/InspectionDetail';
import Inspections from './pages/Inspections';
import Landing from './pages/Landing';

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchUserRole(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchUserRole(session.user.id);
      } else {
        setUserRole(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRole = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (!error && data) {
        setUserRole(data.role);
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9F9F8]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#E8E8E5] border-t-[#15803d] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#8F8F8B] text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={!session ? <Login /> : <Navigate to="/upload" />} />
        <Route path="/signup" element={!session ? <Signup /> : <Navigate to="/upload" />} />
        
        {/* Protected Routes */}
        <Route
          path="/upload"
          element={session ? <Upload userRole={userRole} /> : <Navigate to="/login" />}
        />
        <Route
          path="/inspections"
          element={session ? <Inspections userRole={userRole} /> : <Navigate to="/login" />}
        />
        <Route
          path="/dashboard"
          element={
            session && userRole === 'admin' ? (
              <Dashboard />
            ) : (
              <Navigate to="/upload" />
            )
          }
        />
        <Route
          path="/map"
          element={session ? <MapPage userRole={userRole} /> : <Navigate to="/login" />}
        />
        <Route
          path="/inspection/:id"
          element={session ? <InspectionDetail userRole={userRole} /> : <Navigate to="/login" />}
        />
      </Routes>
    </Router>
  );
}

export default App;
