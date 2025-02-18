// 옵션 배열들을 별도의 변수로 분리
export const departmentArray = [
  "간호팀",
  "물리치료팀",
  "원무팀",
  "방사선팀",
  "진료팀",
  "경영지원팀",
];

export const roleOptions = {
  간호팀: ["팀원", "간호팀장"],
  물리치료팀: ["팀원", "물리치료팀장"],
  원무팀: ["팀원", "원무과장"],
  방사선팀: ["팀원", "방사선팀장"],
  진료팀: ["원장"],
  경영지원팀: ["팀원", "경영지원팀장"],
};

export const locationOptions = {
  간호팀: ["안내 데스크"],
  물리치료팀: [
    "4층 물리치료 데스크",
    "3층 물리치료 데스크",
    "3층 물리치료실 1",
    "3층 물리치료실 2",
  ],
  원무팀: ["원무과장실 PC", "X-RAY실", "초음파실", "C-ARM실"],
  방사선팀: ["X-RAY실", "초음파실", "C-ARM실"],
  진료팀: ["원장실"],
  경영지원팀: ["경영지원팀 PC"],
};

export const allLocationOptions = Object.values(locationOptions).flat();

const hospitalStaff = [
  {
    id: 1,
    name: "박상현",
    role: "의사",
    hospitalOwner: true,
    departmentLeader: true,
    department: "진료",
    email: "chulsoo.kim@hospital.com",
    phone: "010-1111-1111",
  },
  {
    id: 2,
    name: "장원영",
    role: "간호부장",
    hospitalOwner: false,
    departmentLeader: true,
    department: "간호",
    email: "younghee.park@hospital.com",
    phone: "010-2222-2222",
  },
  {
    id: 3,
    name: "안유진",
    role: "간호사",
    hospitalOwner: false,
    departmentLeader: false,
    department: "간호",
    email: "younghee.park@hospital.com",
    phone: "010-2222-2222",
  },
  {
    id: 4,
    name: "김이서",
    role: "간호사",
    hospitalOwner: false,
    departmentLeader: false,
    department: "간호",
    email: "younghee.park@hospital.com",
    phone: "010-2222-2222",
  },
  {
    id: 5,
    name: "장가을",
    role: "간호사",
    hospitalOwner: false,
    departmentLeader: false,
    department: "간호",
    email: "younghee.park@hospital.com",
    phone: "010-2222-2222",
  },
  {
    id: 6,
    name: "최예나",
    role: "방사선사 팀장",
    hospitalOwner: false,
    departmentLeader: true,
    department: "영상의학",
    email: "younghee.park@hospital.com",
    phone: "010-2222-2222",
  },
  {
    id: 7,
    name: "김민지",
    role: "물리치료 팀장",
    hospitalOwner: false,
    departmentLeader: true,
    department: "물리치료",
    email: "younghee.park@hospital.com",
    phone: "010-2222-2222",
  },
  {
    id: 8,
    name: "강해린",
    role: "물리치료사",
    hospitalOwner: false,
    departmentLeader: false,
    department: "물리치료",
    email: "younghee.park@hospital.com",
    phone: "010-2222-2222",
  },
  {
    id: 9,
    name: "팜하니",
    role: "물리치료사",
    hospitalOwner: false,
    departmentLeader: false,
    department: "물리치료",
    email: "younghee.park@hospital.com",
    phone: "010-2222-2222",
  },
  {
    id: 10,
    name: "이혜인",
    role: "물리치료사",
    hospitalOwner: false,
    departmentLeader: false,
    department: "물리치료",
    email: "younghee.park@hospital.com",
    phone: "010-2222-2222",
  },
];

export default hospitalStaff;
