import React from "react";
import styled from "styled-components";

const ToastContainer = styled.div`
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
`;

const ToastItem = styled.div`
  background-color: ${(props) => {
    switch (props.type) {
      case "error":
        return "#f8d7da";
      case "warning":
        return "#fff3cd";
      case "info":
        return "#cff4fc";
      case "success":
      default:
        return "#d4edda";
    }
  }};
  color: ${(props) => {
    switch (props.type) {
      case "error":
        return "#721c24";
      case "warning":
        return "#856404";
      case "info":
        return "#0c5460";
      case "success":
      default:
        return "#155724";
    }
  }};
  padding: 12px 20px;
  border-radius: 4px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  margin-top: 10px;
  animation: fadeIn 0.3s, fadeOut 0.3s 2.7s;
  animation-fill-mode: forwards;
  max-width: 350px;
  min-width: 200px;

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes fadeOut {
    from {
      opacity: 1;
      transform: translateY(0);
    }
    to {
      opacity: 0;
      transform: translateY(-20px);
    }
  }
`;

const Toast = ({ message, type = "success" }) => {
  return <ToastItem type={type}>{message}</ToastItem>;
};

export default Toast;
