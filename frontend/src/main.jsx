import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import "./index.css";
import Dashboard from "./pages/Dashboard";
import Matchmaking from "./pages/Matchmaking";
import Register from "./pages/Register";

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/matchmaking" element={<Matchmaking />} />
    </Routes>
  </BrowserRouter>
);
