import { BrowserRouter, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import HomePage from "./components/HomePage"; // Figma Home
import GamingPage from "./components/GamingPage";
import StreamingPage from "./components/StreamingPage";
import ShoppingPage from "./components/ShoppingPage";
import MusicPage from "./components/MusicPage";
import FoodDrinkPage from "./components/FoodDrinkPage";
import TravelPage from "./components/TravelPage";
import AboutUsPage from "./components/AboutUsPage";
import ContactPage from "./components/ContactPage";
import FAQPage from "./components/FAQPage";
export default function App(){
  return (
    <BrowserRouter>
      <Header/>
      <main className="container" style={{padding:"32px 0"}}>
        <Routes>
          <Route path="/" element={<HomePage/>}/>
          <Route path="/gaming" element={<GamingPage/>}/>
          <Route path="/streaming" element={<StreamingPage/>}/>
          <Route path="/shopping" element={<ShoppingPage/>}/>
          <Route path="/music" element={<MusicPage/>}/>
          <Route path="/fooddrink" element={<FoodDrinkPage/>}/>
          <Route path="/travel" element={<TravelPage/>}/>
          <Route path="/about" element={<AboutUsPage/>}/>
          <Route path="/contact" element={<ContactPage/>}/>
          <Route path="/faq" element={<FAQPage/>}/>
        </Routes>
      </main>
      <Footer/>
    </BrowserRouter>
  );
}
