import React, { useState, useEffect } from "react";
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
import Schedule from "./pages/Schedule";
import Vacation from "./pages/Vacation";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "./firebase";
import { notification } from "./assets/sound";
// TODO: Add SDKs for Firebase products that you want to use

const App = () => {
  // useEffect(() => {
  //   const q = query(
  //     collection(db, "calls"),
  //     orderBy("createdAt", "desc"),
  //     limit(5)
  //   );

  //   const unsubscribe = onSnapshot(q, (snapshot) => {
  //     snapshot.docChanges().forEach((change) => {
  //       if (change.type === "added") {
  //         const data = change.doc.data();
  //         const audio = new Audio(notification);
  //         audio.play();

  //         if (window.electron && window.electron.sendNotification) {
  //           window.electron.sendNotification(`새 메시지: ${data.message}`);
  //         }
  //       }
  //     });
  //   });

  //   return () => unsubscribe();
  // }, []);

  return (
    <div className="bg-primary w-full overflow-hidden bg-onceBackground">
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
        <Route path="/schedule" element={<Schedule />} />
        <Route path="/vacation" element={<Vacation />} />
      </Routes>
      {/* <ChatBot /> */}
    </div>
  );
};

export default App;
