import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // Your global styles
import App from './App'; // Your main application component
import reportWebVitals from './reportWebVitals';

// Create a root element for rendering the React app
const root = ReactDOM.createRoot(document.getElementById('root'));

// Render the App component within StrictMode for development
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, call reportWebVitals
// and pass a function to log results (e.g., reportWebVitals(console.log))
// or send the results to an analytics endpoint.
// Learn more: https://bit.ly/CRA-vitals

// For basic web vitals logging (to the console):
reportWebVitals(console.log);

// For sending to an analytics endpoint (e.g., Google Analytics):
// reportWebVitals(sendToAnalytics);
//
// function sendToAnalytics(metric) {
//   // Replace this with your analytics code (e.g., using react-ga)
//   console.log("Sending metric to analytics:", metric);
//   // Example using react-ga (you would need to set up react-ga first):
//   // ReactGA.event({
//   //   category: 'Web Vitals',
//   //   action: metric.name,
//   //   label: metric.label,
//   //   value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value), // CLS should be reported as an integer (thousandths of a second)
//   //   nonInteraction: true, // Indicates that the event is not interactive
//   // });
// }