import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import ScrollToTop from './components/ScrollToTop';
import Home from './pages/Home';
import Training from './pages/Training';
import Fonctionnement from './pages/Fonctionnement';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Credits from './pages/Credits';
import MentionsLegales from './pages/MentionsLegales';
import PolitiqueConfidentialite from './pages/PolitiqueConfidentialite';
import ConditionsGenerales from './pages/ConditionsGenerales';
import PolitiqueCookies from './pages/PolitiqueCookies';
import FAQ from './pages/FAQ';
import GuideUtilisation from './pages/GuideUtilisation';
import Contact from './pages/Contact';
import APropos from './pages/APropos';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/training" element={<Training />} />
            <Route path="/fonctionnement" element={<Fonctionnement />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/credits" element={<Credits />} />
            <Route path="/mentions-legales" element={<MentionsLegales />} />
            <Route path="/politique-confidentialite" element={<PolitiqueConfidentialite />} />
            <Route path="/conditions-generales" element={<ConditionsGenerales />} />
            <Route path="/politique-cookies" element={<PolitiqueCookies />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/guide-utilisation" element={<GuideUtilisation />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/a-propos" element={<APropos />} />
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  );
}

export default App;