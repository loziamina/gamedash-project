import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import "./index.css";
import Dashboard from "./pages/Dashboard";
import Matchmaking from "./pages/Matchmaking";
import Register from "./pages/Register";
import Game from "./pages/Game";
import History from "./pages/History";

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/matchmaking" element={<Matchmaking />} />
      <Route path="/game" element={<Game />} />
      <Route path="/history" element={<History />} />
    </Routes>
  </BrowserRouter>
);
