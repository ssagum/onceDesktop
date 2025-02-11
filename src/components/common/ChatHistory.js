import React from "react";

const ChatHistory = () => {
  // 수신자의 ID (메시지를 보낸 사람이 수신자인 경우 해당 스타일 적용)
  const receiverId = "user1";

  // 더미 데이터 (recentCalls)
  const recentCalls = [
    {
      docId: "1",
      senderId: "user1",
      message: "Hi there!",
      formattedTime: "2025-02-08 10:00 AM",
    },
    {
      docId: "2",
      senderId: "user2",
      message: "Hello, how can I help?",
      formattedTime: "2025-02-08 10:01 AM",
    },
    {
      docId: "3",
      senderId: "user1",
      message: "I have a question about my order.",
      formattedTime: "2025-02-08 10:05 AM",
    },
    {
      docId: "4",
      senderId: "user3",
      message: "Sure, please tell me more.",
      formattedTime: "2025-02-08 10:06 AM",
    },
    {
      docId: "5",
      senderId: "user2",
      message: "Can you update me on the status?",
      formattedTime: "2025-02-08 10:07 AM",
    },
    {
      docId: "6",
      senderId: "user1",
      message: "Yes, please provide an update.",
      formattedTime: "2025-02-08 10:08 AM",
    },
  ];

  return (
    <div className="h-[200px] overflow-y-scroll p-4 bg-slate-100 rounded-md shadow-inner">
      <ul className="flex flex-col gap-4">
        {recentCalls.map((call) => (
          <li
            key={call.docId}
            className={`max-w-[70%] p-3 rounded-xl shadow-md ${
              call.senderId === receiverId
                ? "bg-green-200 self-end text-right ml-auto"
                : "bg-gray-200 self-start text-left mr-auto"
            }`}
          >
            <p className="text-sm text-gray-700">
              {call.senderId === receiverId
                ? `${call.message} - ${call.formattedTime}`
                : `${call.senderId} - ${call.formattedTime}`}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ChatHistory;
