import React from "react";
import ReactDOM from "react-dom/client";
import { ToastContainer } from "react-toastify";

import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";

import "react-toastify/dist/ReactToastify.css";
import "./index.css";

ReactDOM.createRoot(
  document.getElementById("root")
).render(
  <React.StrictMode>
    <AuthProvider>
      <App />

      <ToastContainer
        position="top-right"
        autoClose={3000}
        newestOnTop
        theme="dark"
      />
    </AuthProvider>
  </React.StrictMode>
);