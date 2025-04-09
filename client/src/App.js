import AppRoutes from "./AppRoutes"
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { UserProvider } from "./context/userContext";

function App() {
  return (
    <UserProvider>
      <Router>
        <Routes>
          <Route path="/*" element={<AppRoutes />} />
        </Routes>
      </Router>
    </UserProvider>
  )
}

export default App
