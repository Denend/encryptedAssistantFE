import {createBrowserRouter, RouterProvider} from "react-router-dom";
import './App.css';
import { HomePage } from "./pages/Home";
import { QueryClientProvider, QueryClient } from "react-query";
import { Helmet } from "react-helmet";

const router = createBrowserRouter([
  {path: "/:id?", element: <HomePage />},
]);

const queryClient = new QueryClient();

function App() {
  return (
    <div className="App">
        <Helmet>
            <title>EncryptedAssistant</title>
            <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        </Helmet>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </div>
  );
}

export default App;
