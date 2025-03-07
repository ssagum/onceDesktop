import React, { useState, useRef, useEffect } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { IoPrintOutline } from "react-icons/io5";
import { PDFDocument } from "pdf-lib";
import html2canvas from "html2canvas";
import "./QRCodeGenerator.css";

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

const QRCodeGenerator = ({ idList }) => {
  const [qrSize, setQrSize] = useState(150);
  const [showIds, setShowIds] = useState(true);
  const [idFontSize, setIdFontSize] = useState(14);
  const [pages, setPages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const qrContainerRef = useRef();

  // 고정된 QR 레이아웃 계산
  useEffect(() => {
    // A4 크기와 여백 고려 (210mm x 297mm)
    const pageWidth = 210; // mm
    const pageHeight = 297; // mm
    const pagePadding = 10; // mm
    const itemPadding = 5; // mm

    // QR 크기 비율 계산 (150을 기준으로)
    const sizeRatio = qrSize / 150;

    // 항상 2열로 고정
    const itemsPerRow = 2;

    // QR 코드 아이템 너비 계산 (2열 고정)
    const availableWidth = pageWidth - pagePadding * 2;
    const itemSpacing = 5; // QR 코드 사이 간격을 5mm로 줄임
    const itemWidth = (availableWidth - itemSpacing) / itemsPerRow;

    // QR 코드와 텍스트의 실제 높이 계산
    const qrHeight = itemWidth * (qrSize / 150);
    const idTextHeight = showIds ? Math.max(6, idFontSize / 2) : 0;
    const itemHeight = qrHeight + idTextHeight;

    // 페이지 높이 계산
    const availableHeight = pageHeight - pagePadding * 2;
    const rowSpacing = 5; // 행 간격도 5mm로 줄임

    // 한 페이지에 들어갈 수 있는 행 수 계산
    const itemsPerColumn = Math.floor(
      availableHeight / (itemHeight + rowSpacing)
    );
    const itemsPerPage = itemsPerRow * Math.max(1, itemsPerColumn);

    // 페이지로 분할
    const totalPages = Math.ceil(idList.length / itemsPerPage);
    const pageItems = [];

    for (let i = 0; i < totalPages; i++) {
      const startIdx = i * itemsPerPage;
      pageItems.push({
        items: idList.slice(startIdx, startIdx + itemsPerPage),
        cols: itemsPerRow,
      });
    }

    setPages(pageItems);
  }, [idList, qrSize, showIds, idFontSize]);

  const handlePrint = () => {
    // 인쇄 전 스크롤을 맨 위로 이동
    window.scrollTo(0, 0);

    // 작은 지연 후 인쇄 다이얼로그 실행
    setTimeout(() => {
      window.print();
    }, 300);
  };

  const handleDownloadPDF = async () => {
    try {
      setIsLoading(true);

      const pdfDoc = await PDFDocument.create();

      // 각 페이지 처리
      for (let i = 0; i < pages.length; i++) {
        const pageContainer = document.getElementById(`qr-page-${i}`);

        // 페이지 캡처를 위해 스타일 임시 조정
        const allPages = document.querySelectorAll(".qr-page");
        allPages.forEach((page) => {
          page.style.display = "block";
          page.style.position = "relative";
          page.style.overflow = "visible";
          page.style.margin = "0 auto";
        });

        // 페이지 캡처 전 잠시 지연
        await new Promise((resolve) => setTimeout(resolve, 100));

        // 페이지 캡처
        const canvas = await html2canvas(pageContainer, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          logging: false,
          width: pageContainer.offsetWidth,
          height: pageContainer.offsetHeight,
          x: 0,
          y: 0,
        });

        // PDF에 고정 크기로 추가
        const pdfPage = pdfDoc.addPage([595.28, 841.89]); // A4 크기 (포인트 단위)
        const { width, height } = pdfPage.getSize();

        const pngImage = await pdfDoc.embedPng(
          canvas.toDataURL("image/png", 1.0)
        );

        // PDF에 이미지 추가 (A4 페이지에 맞춤)
        pdfPage.drawImage(pngImage, {
          x: 0,
          y: 0,
          width: width,
          height: height,
        });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "QR_Codes.pdf";
      link.click();
    } catch (error) {
      console.error("PDF 생성 중 오류 발생:", error);
      alert("PDF 생성 중 오류가 발생했습니다: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // QR 코드 유닛 크기 계산 (사용자 설정 qrSize 반영)
  const calculateQrUnitSize = () => {
    return Math.floor(qrSize);
  };

  return (
    <div className="flex flex-col items-center w-full">
      <div className="sticky top-0 bg-white w-full p-4 z-10 border-b no-print">
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <label className="font-semibold whitespace-nowrap">QR 크기:</label>
            <input
              type="range"
              min="60"
              max="300"
              value={qrSize}
              onChange={(e) => setQrSize(parseInt(e.target.value, 10))}
              className="w-[120px]"
            />
            <span className="text-xs w-8">{qrSize}px</span>
          </div>

          <div className="flex items-center gap-2">
            <label className="font-semibold whitespace-nowrap">아이디:</label>
            <input
              type="checkbox"
              checked={showIds}
              onChange={(e) => setShowIds(e.target.checked)}
              className="h-4 w-4"
            />
          </div>

          {showIds && (
            <div className="flex items-center gap-2">
              <label className="font-semibold whitespace-nowrap">
                폰트 크기:
              </label>
              <input
                type="range"
                min="8"
                max="24"
                value={idFontSize}
                onChange={(e) => setIdFontSize(parseInt(e.target.value, 10))}
                className="w-[100px]"
              />
              <span className="text-xs w-8">{idFontSize}px</span>
            </div>
          )}

          <div className="flex gap-2 ml-auto">
            {/* 인쇄 버튼 숨김 */}
            {/*
            <button
              onClick={handlePrint}
              className="px-3 py-1 bg-blue-600 text-white rounded-md flex items-center gap-1 text-sm"
            >
              <IoPrintOutline size={16} /> 인쇄
            </button>
            */}
            <button
              onClick={handleDownloadPDF}
              disabled={isLoading}
              className={`px-3 py-1 ${
                isLoading ? "bg-gray-500" : "bg-green-600"
              } text-white rounded-md flex items-center gap-1 text-sm`}>
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1"></div>
                  변환 중...
                </>
              ) : (
                "PDF 다운로드"
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 w-full h-[calc(100vh-200px)] overflow-auto qr-print-container">
        <div
          ref={qrContainerRef}
          className="qr-pages-container flex flex-col items-center">
          {pages.map((page, pageIndex) => (
            <div
              id={`qr-page-${pageIndex}`}
              key={`page-${pageIndex}`}
              className="qr-page print-page"
              style={{
                width: "210mm",
                minHeight: "297mm",
                margin: "0 auto 20px auto",
                padding: "10mm",
                boxShadow: "0 0 10px rgba(0, 0, 0, 0.1)",
                backgroundColor: "white",
                boxSizing: "border-box",
                display: "flex",
                justifyContent: "center",
                alignItems: "flex-start",
              }}>
              <div
                className="qr-grid"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: "5mm",
                  width: "100%",
                }}>
                {page.items.map((id) => (
                  <div
                    key={id}
                    className="qr-item"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      padding: "5mm",
                      border: "1px solid #ddd",
                      borderRadius: "3mm",
                      width: "100%",
                      boxSizing: "border-box",
                    }}>
                    <QRCodeCanvas
                      id={`qr-${id}`}
                      value={id}
                      size={calculateQrUnitSize()}
                    />
                    {showIds && (
                      <span
                        className="mt-2 font-semibold text-center w-full"
                        style={{
                          fontSize: `${idFontSize}px`,
                          wordBreak: "keep-all",
                          width: "100%",
                          padding: "0 2mm",
                        }}>
                        {id}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QRCodeGenerator;
