import React, { useState } from "react";
import { Routes, Route } from "react-router-dom";
// Import the functions you need from the SDKs you need
import Home from "./pages/Home";
import Contact from "./pages/Contact";
import Notice from "./pages/Notice";
import Education from "./pages/Education";
import Warehouse from "./pages/Warehouse";
import Call from "./pages/Call";
import Write from "./pages/Write";
import Task from "./pages/Task";
// TODO: Add SDKs for Firebase products that you want to use

const App = () => {
  return (
    <div className="bg-primary w-full overflow-hidden bg-blue-300">
      {/* 헤더부분 */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/Notice" element={<Notice />} />
        <Route path="/Education" element={<Education />} />
        <Route path="/Warehouse" element={<Warehouse />} />
        <Route path="/write" element={<Write />} />
        <Route path="/Call" element={<Call />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/task" element={<Task />} />
      </Routes>
      {/* <ChatBot /> */}
    </div>
  );
};

export default App;
