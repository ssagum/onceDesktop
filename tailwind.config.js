module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx,html}",
    "./public/index.html",
    "./src/renderer/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        commonBackground: "#888888",
        commonContainer: "#DBDBDB",
        commonBorder: "#5F64EB",
        onceBlue: "#002D5D",
        onceChipBlue: "#BDC5FA",
        onceYellow: "#F4A809",
        onceChipYellow: "#FEFDD4",
        onceOrange: "#FF762D",
        onceChipOrange: "#FAD6BD",
        onceGray: "#9D9D9C",
        onceGreen: "#16B028",
        onceChipGreen: "#D5FFCB",
        onceRed: "#FF2D2D",
        onceChipRed: "#FFBFBF",
        onceBackground: "#EFF3F4",
        onceTextBackground: "#FCFAFA",
        hoverYellow: "#FFF0D1",
        textBackground: "#FCFAFA",
        onceHover: "#FFF0D1",
      },
      fontSize: {
        once20: "20px",
        once18: "18px",
        once17: "17px",
        once16: "16px",
        once14: "14px",
      },
      // width에 사용자 정의 값 추가
      width: {
        // 예: w-custom 클래스 사용 시 너비가 800px
        onceSidebarW: "800px",
        onceMainW: "1000px",
        onceBigModal: "1100px",
      },
      // height에 사용자 정의 값 추가
      height: {
        // 예: h-custom 클래스 사용 시 높이가 500px
        onceH: "900px",
        onceBigModalH: "840px",
        boxH: "50px",
      },
      padding: {
        onceGap: "20px",
      },
      spacing: {
        // 'custom-gap'를 사용하면 값이 30px인 gap을 만들 수 있음
        onceGap: "20px",
      },
    },
  },
  plugins: [],
};
