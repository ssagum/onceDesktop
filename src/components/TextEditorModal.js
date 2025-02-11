import React, { useState } from "react";

const TextEditorModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState("");

  const toggleModal = () => {
    setIsOpen(!isOpen);
  };

  const handleSave = () => {
    console.log("Saved Content:", content);
    toggleModal();
  };

  return (
    <div className="relative">
      <button
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        onClick={toggleModal}
      >
        Write Post
      </button>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white w-11/12 max-w-3xl rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Write Your Post</h2>
              <button
                className="text-gray-600 hover:text-gray-800"
                onClick={toggleModal}
              >
                ×
              </button>
            </div>

            <div className="flex justify-end mt-4">
              <button
                className="bg-gray-300 text-gray-800 px-4 py-2 rounded mr-2 hover:bg-gray-400"
                onClick={toggleModal}
              >
                Cancel
              </button>
              <button
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                onClick={handleSave}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TextEditorModal;
