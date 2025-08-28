import { BrowserRouter, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import HomePage from "./components/HomePage"; // Figma Home
import CategoryPage from "./pages/category/CategoryPage";
import AboutUsPage from "./components/AboutUsPage";
import ContactPage from "./components/ContactPage";
import FAQPage from "./components/FAQPage";
import CartPage from "./pages/checkout/CartPage";
export default function App(){
  return (
    <BrowserRouter>
      <Header/>
      <main className="container" style={{padding:"32px 0"}}>
        <Routes>
          <Route path="/" element={<HomePage/>}/>
          <Route path="/gaming" element={<CategoryPage category="gaming"/>}/>
          <Route path="/streaming" element={<CategoryPage category="streaming"/>}/>
          <Route path="/shopping" element={<CategoryPage category="shopping"/>}/>
          <Route path="/music" element={<CategoryPage category="music"/>}/>
          <Route path="/fooddrink" element={<CategoryPage category="fooddrink"/>}/>
          <Route path="/travel" element={<CategoryPage category="travel"/>}/>
          <Route path="/about" element={<AboutUsPage/>}/>
          <Route path="/contact" element={<ContactPage/>}/>
          <Route path="/faq" element={<FAQPage/>}/>
          <Route path="/cart" element={<CartPage/>}/>
        </Routes>
      </main>
      <Footer/>
    </BrowserRouter>
  );
}
