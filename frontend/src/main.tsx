import React from "react";
import ReactDOM from "react-dom/client";
import "./styles/global.css";
import App from "./App";

if (typeof window !== "undefined") {
  const onScroll = () => {
    if (window.scrollY > 2) document.body.classList.add("has-scroll");
    else document.body.classList.remove("has-scroll");
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
