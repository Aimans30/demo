import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // Ensure this import is correct and points to your CSS file
import App from './App';
import reportWebVitals from './reportWebVitals';

// Create a root for rendering the app
const root = ReactDOM.createRoot(document.getElementById('root'));

// Render the App component inside React.StrictMode
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Optional: Measure performance in your app
// Pass a function to log results (e.g., reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();