import React from "react";
import * as ReactDOMClient from "react-dom/client";
import { ApolloProvider } from "@apollo/client";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import "./styles/styles.css";
import { client } from "./apollo";

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Failed to find the root element");
const root = ReactDOMClient.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <ApolloProvider client={client}>
      <App />
    </ApolloProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
