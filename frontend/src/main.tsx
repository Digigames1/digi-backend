import React from "react";
import ReactDOM from "react-dom/client";
import "./styles/global.css";
import App from "./App";

function applyHeaderHeight(){
  const el = document.getElementById("app-header");
  if (!el) return;
  const h = el.offsetHeight;
  document.documentElement.style.setProperty("--header-h", h + "px");
}
if (typeof window !== "undefined") {
  window.addEventListener("load", applyHeaderHeight);
  window.addEventListener("resize", applyHeaderHeight);
  const onScroll = () => {
    if (window.scrollY > 2) document.body.classList.add("has-scroll");
    else document.body.classList.remove("has-scroll");
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}
ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
