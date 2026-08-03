import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import ProtectedAdminRoute from "./components/ProtectedAdminRoute.jsx";
import AdminLogin from "./pages/AdminLogin.jsx";
import AttackScreen from "./pages/AttackScreen.jsx";
import RoundSetup from "./pages/RoundSetup.jsx";
import AdminHome from "./pages/AdminHome.jsx";
import CreateGame from "./pages/CreateGame.jsx";
import GameSetupResult from "./pages/GameSetupResult.jsx";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin/login" element={<AdminLogin />} />

        <Route element={<ProtectedAdminRoute />}>
          <Route path="/admin" element={<AdminHome />} />
          <Route path="/admin/games/new" element={<CreateGame />} />
          <Route
            path="/admin/games/:gameId"
            element={<GameSetupResult />}
          />
        </Route>
        <Route
  path="/admin/games/:gameId/attack"
  element={<AttackScreen />}
/>
        <Route
  path="/admin/games/:gameId/setup-round"
  element={<RoundSetup />}
/>

        <Route path="/" element={<Navigate to="/admin" replace />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;