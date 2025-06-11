// src/components/MathKeyboard.jsx
import React, { useState, useRef, useEffect } from "react";
import mathSymbols from "./mathSymbols";
import katex from "katex";
import "katex/dist/katex.min.css";

const MathKeyboard = ({ onSymbolSelect, onClose }) => {
  const [activeTab, setActiveTab] = useState("Common");
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [customRows, setCustomRows] = useState(1);
  const [customCols, setCustomCols] = useState(1);
  const keyboardRef = useRef(null);
  const mathFieldRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (keyboardRef.current && !keyboardRef.current.contains(event.target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  useEffect(() => {
    if (!mathFieldRef.current) return;

    const initializeMathQuill = () => {
      if (window.MathQuill) {
        const MQ = window.MathQuill.getInterface(2);
        const mathField = MQ.MathField(mathFieldRef.current, {
          handlers: {
            edit: () => {
              const latex = mathField.latex();
              onSymbolSelect({ latex, moveLeft: 0 });
            },
          },
        });
        return mathField;
      } else {
        console.warn("MathQuill chưa tải xong, thử lại...");
        return null;
      }
    };

    let mathField = initializeMathQuill();
    if (!mathField) {
      const interval = setInterval(() => {
        mathField = initializeMathQuill();
        if (mathField) {
          clearInterval(interval);
        }
      }, 100);
      return () => clearInterval(interval);
    }

    return () => mathField?.revert();
  }, [onSymbolSelect]);

  const generateCustomMatrixLatex = (rows, cols) => {
    let latex = "\\begin{pmatrix}";
    for (let i = 0; i < rows; i++) {
      const row = Array(cols).fill("\\Box").join(" & ");
      latex += row;
      if (i < rows - 1) latex += " \\\\ ";
    }
    latex += "\\end{pmatrix}";
    return latex;
  };

  const handleSymbolClick = (latex, moveLeft, isCustom = false) => {
    if (isCustom) {
      setIsCustomModalOpen(true);
    } else {
      onSymbolSelect({ latex, moveLeft });
      onClose();
    }
  };

  const handleCustomMatrixSubmit = () => {
    if (
      customRows < 1 ||
      customRows > 10 ||
      customCols < 1 ||
      customCols > 10
    ) {
      alert("Số hàng và số cột phải từ 1 đến 10!");
      return;
    }
    const latex = generateCustomMatrixLatex(customRows, customCols);
    onSymbolSelect({ latex, moveLeft: 0 });
    setIsCustomModalOpen(false);
    onClose();
  };

  const tabs = Object.keys(mathSymbols);
  const tabLabels = {
    Basic: "Basic",
    "Greek (small)": "α β γ",
    "Greek (large)": "A B Γ",
    Trigonometry: "sin cos",
    Operators: "≥ ÷ →",
    Accents: "\\overline{x} ℂ ∀",
    "Big Operators": "∑ ∫ ∏",
    "Matrices & Vectors": "(☐ ☐)",
    Chemistry: "H₂O",
    Calculator: "Calc",
  };

  const renderSymbol = (latex) => {
    return katex.renderToString(latex, { throwOnError: false });
  };

  const chunkArray = (array, size) => {
    const chunked = [];
    for (let i = 0; i < array.length; i += size) {
      chunked.push(array.slice(i, i + size));
    }
    return chunked;
  };

  return (
    <div
      ref={keyboardRef}
      className="math-keyboard-container bg-gray-800 text-white rounded-lg shadow-lg p-4 w-full max-h-[400px] overflow-y-auto custom-scrollbar"
    >
      <table className="math-keyboard-form w-full">
        <tbody>
          <tr id="MathKeyboardHead" className="border-b border-gray-600">
            {tabs.map((tabName) => (
              <td key={tabName} className="p-1">
                <button
                  className={`px-2 py-1 rounded-t-lg transition-colors w-full text-center ${
                    activeTab === tabName
                      ? "bg-red-600 text-white"
                      : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                  }`}
                  onClick={() => setActiveTab(tabName)}
                  title={tabName}
                >
                  <span
                    dangerouslySetInnerHTML={{
                      __html: renderSymbol(tabLabels[tabName]),
                    }}
                  />
                </button>
              </td>
            ))}
          </tr>
          <tr className="math-keyboard-body">
            <td colSpan={tabs.length}>
              <div className="button-container">
                {tabs.map((tabName) => {
                  const symbolChunks = chunkArray(mathSymbols[tabName], 10);
                  return (
                    <table
                      key={tabName}
                      className={`w-full ${
                        activeTab === tabName ? "" : "hidden"
                      }`}
                    >
                      <tbody>
                        {symbolChunks.map((chunk, rowIndex) => (
                          <tr key={rowIndex}>
                            {chunk.map((symbolData, index) => (
                              <td key={index} className="p-1">
                                <button
                                  className="padButton bg-gray-700 hover:bg-gray-600 text-white rounded-lg p-2 w-full transition-colors"
                                  onClick={() =>
                                    handleSymbolClick(
                                      symbolData.latex,
                                      symbolData.moveLeft,
                                      symbolData.isCustom
                                    )
                                  }
                                  title={symbolData.latex}
                                >
                                  <span
                                    dangerouslySetInnerHTML={{
                                      __html: renderSymbol(symbolData.symbol),
                                    }}
                                  />
                                </button>
                              </td>
                            ))}
                            {chunk.length < 10 &&
                              Array(10 - chunk.length)
                                .fill()
                                .map((_, index) => (
                                  <td key={`empty-${index}`} className="p-1" />
                                ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  );
                })}
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      {isCustomModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-gray-800 text-white rounded-lg p-4 w-80">
            <h3 className="text-lg font-semibold mb-4">Custom Matrix Size</h3>
            <div className="flex space-x-4 mb-4">
              <div>
                <label className="block mb-1">Rows (1-10):</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={customRows}
                  onChange={(e) => setCustomRows(Number(e.target.value))}
                  className="p-2 rounded bg-gray-700 text-white w-full"
                />
              </div>
              <div>
                <label className="block mb-1">Columns (1-10):</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={customCols}
                  onChange={(e) => setCustomCols(Number(e.target.value))}
                  className="p-2 rounded bg-gray-700 text-white w-full"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setIsCustomModalOpen(false)}
                className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={handleCustomMatrixSubmit}
                className="px-4 py-2 bg-red-600 rounded hover:bg-red-500"
              >
                Insert
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MathKeyboard;


