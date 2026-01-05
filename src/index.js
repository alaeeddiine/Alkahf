import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { PayPalScriptProvider } from "@paypal/react-paypal-js";

const root = ReactDOM.createRoot(document.getElementById("root"));

const paypalOptions = {
  "client-id": "ASy8MJr1lFjKi_L_bSEQKqk0ujcsm8-XYysdHiv7Sbt40gAMk11hVTvuhEUFS7-WQr3mfYQj2W-ReH8r", // sandbox
  currency: "EUR",
  intent: "capture",
  components: "buttons", // charge le module des boutons
};

root.render(
  <React.StrictMode>
    <PayPalScriptProvider options={paypalOptions}>
      <App />
    </PayPalScriptProvider>
  </React.StrictMode>
);
