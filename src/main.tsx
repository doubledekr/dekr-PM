import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import './index.css';
import App from './App.tsx';
import Projects from './pages/Projects.tsx';
import ProjectBoard from './pages/ProjectBoard.tsx';
import Predict from './pages/Predict.tsx';
import MyTrackRecord from './pages/MyTrackRecord.tsx';
import AssetPage from './pages/AssetPage.tsx';

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <Projects /> },
      { path: "p/:projectId", element: <ProjectBoard /> },
      { path: "predict", element: <Predict /> },
      { path: "me", element: <MyTrackRecord /> },
      { path: "asset/:symbol", element: <AssetPage /> },
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
