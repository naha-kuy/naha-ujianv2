import { NotificationProvider } from "./contexts/NotificationContext";
import NotificationContainer from "./views/components/NotificationContainer";
import RouteController from "./controllers/RouteController";

function App() {
  return (
    <NotificationProvider>
      <RouteController />
      <NotificationContainer />
    </NotificationProvider>
  );
}

export default App;
