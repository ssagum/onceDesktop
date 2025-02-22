import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import styled from "styled-components";
import SideBar from "../components/SideBar";
import TextEditorModal from "../components/TextEditorModal";
import HomeMainCanvas from "../components/Home/HomeMainCanvas";
import HomeTimerCanvas from "../components/Home/HomeTimerCanvas";
import TaskMainCanvas from "../components/Task/TaskMainCanvas";

const MainZone = styled.div``;

const Task = () => {
  const { pathname } = useLocation();

  // 페이지 전체 리턴
  return (
    // h-screen 을 넘어가는 페이지는 h-screen 당연히 쓰면 안 됨
    <div className="flex flex-row w-full h-screen bg-onceBackground items-center">
      <div className="w-[250px] h-full flex flex-col justify-center">
        <SideBar />
      </div>
      <MainZone className="w-full flex flex-col justify-evenly items-center bg-onceBackground h-screen">
        <section className="flex flex-row items-center w-full justify-between h-full rounded-2xl p-[20px]">
          <TaskMainCanvas />
        </section>
      </MainZone>
    </div>
  );
};

export default Task;
