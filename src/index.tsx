/**
 * Application Entry Point
 *
 * This is the main entry file that bootstraps the React application
 * and renders the ServiceDesk component into the DOM.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import ServiceDeskApp from './ServiceDesk';

// Get the root element from the DOM
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Failed to find the root element. Make sure index.html has a div with id="root"');
}

// Create React root and render the application
const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <ServiceDeskApp />
  </React.StrictMode>
);

// Enable Hot Module Replacement for development
if (import.meta.hot) {
  import.meta.hot.accept();
}
