// src/App.jsx
import { Outlet } from "react-router-dom";
import SideBar from "./components/SideBar";
import "katex/dist/katex.min.css";

function App() {
  return (
    <div className="bg-primaryBg-default dark:bg-primaryBg-darkDefault h-screen flex">
      <div className="xl:block hidden">
        <SideBar />
      </div>
      <Outlet />
    </div>
  );
}

export default App;
