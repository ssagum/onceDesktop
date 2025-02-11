import React, { useState, useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { IoPrintOutline } from "react-icons/io5";
import { PDFDocument, rgb } from "pdf-lib";
import html2canvas from "html2canvas";

const ids = [
  "진미_평양_오뎅",
  "전주_함흥_마들렌",
  "서울_강남_순대",
  "부산_해운대_떡볶이",
  "대구_동성로_호떡",
  "광주_충장로_김밥",
  "인천_송도_핫도그",
  "제주_서귀포_한라봉",
  "춘천_닭갈비_막국수",
  "수원_갈비_만두",
  "대전_성심당_튀김소보로",
  "울산_태화강_어묵",
  "전남_여수_갓김치",
  "경북_경주_찰보리빵",
  "충북_청주_순대국",
  "강원_속초_오징어순대",
  "전북_남원_추어탕",
  "충남_공주_밤빵",
  "경남_통영_꿀빵",
  "세종_조치원_복숭아",
];

const QRCodeGenerator = () => {
  const [qrSize, setQrSize] = useState(150);
  const printRef = useRef();

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    const pdfDoc = await PDFDocument.create();

    const page = pdfDoc.addPage([595.28, 841.89]); // A4 크기
    const { width, height } = page.getSize();
    const margin = 30;
    let x = margin;
    let y = height - margin - qrSize - 20;
    const qrPerRow = 3;

    for (let i = 0; i < ids.length; i++) {
      const element = document.getElementById(`qr-${ids[i]}`);
      const canvas = await html2canvas(element, { scale: 2 });
      const qrImage = await pdfDoc.embedPng(canvas.toDataURL("image/png"));

      page.drawImage(qrImage, {
        x,
        y,
        width: qrSize,
        height: qrSize,
      });

      x += qrSize + margin;
      if ((i + 1) % qrPerRow === 0) {
        x = margin;
        y -= qrSize + margin + 20;
      }
    }

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "QR_Codes.pdf";
    link.click();
  };

  return (
    <div className="flex flex-col items-center w-full h-screen overflow-y-auto">
      <div className="flex justify-between w-full mb-4">
        <label className="font-semibold">QR 크기 조정: </label>
        <input
          type="range"
          min="60"
          max="300"
          value={qrSize}
          onChange={(e) => setQrSize(parseInt(e.target.value, 10))}
          className="w-[200px]"
        />
      </div>

      <div
        ref={printRef}
        className="grid grid-cols-3 gap-4 p-4 border rounded-md bg-white w-full"
        style={{ pageBreakInside: "avoid" }}
      >
        {ids.map((id) => (
          <div
            key={id}
            className="flex flex-col items-center p-2 border rounded-md"
          >
            <QRCodeCanvas id={`qr-${id}`} value={id} size={qrSize} />
            <span className="mt-2 font-semibold text-sm">{id}</span>
          </div>
        ))}
      </div>

      <div className="flex gap-4 mt-4">
        <button
          onClick={handlePrint}
          className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center gap-2"
        >
          <IoPrintOutline size={20} /> QR 코드 인쇄
        </button>
        <button
          onClick={handleDownloadPDF}
          className="px-4 py-2 bg-green-600 text-white rounded-md flex items-center gap-2"
        >
          PDF 다운로드
        </button>
      </div>
    </div>
  );
};

export default QRCodeGenerator;
