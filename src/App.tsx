import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import KlineReplay from "@/pages/KlineReplay";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<KlineReplay />} />
      </Routes>
    </Router>
  );
}
