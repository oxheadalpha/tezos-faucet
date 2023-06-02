import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import 'bootstrap/dist/css/bootstrap.min.css';

// For `vite preview` to get around "Buffer undefined"
import { Buffer as BufferPolyfill } from "buffer"
declare var Buffer: typeof BufferPolyfill
globalThis.Buffer = BufferPolyfill

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

