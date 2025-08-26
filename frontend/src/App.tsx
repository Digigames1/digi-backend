import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Gaming from './pages/Gaming';
import Streaming from './pages/Streaming';
import Shopping from './pages/Shopping';
import Music from './pages/Music';
import FoodDrink from './pages/FoodDrink';
import Travel from './pages/Travel';
import AboutUs from './pages/AboutUs';
import Contact from './pages/Contact';
import FAQ from './pages/FAQ';

export default function App() {
  return (
    <div className="app">
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/gaming" element={<Gaming />} />
          <Route path="/streaming" element={<Streaming />} />
          <Route path="/shopping" element={<Shopping />} />
          <Route path="/music" element={<Music />} />
          <Route path="/fooddrink" element={<FoodDrink />} />
          <Route path="/travel" element={<Travel />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/faq" element={<FAQ />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
