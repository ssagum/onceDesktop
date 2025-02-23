import { filterHiddenDocuments } from "../utils/filterUtils";

const SomeComponent = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const querySnapshot = await getDocs(collection(db, "someCollection"));
      const documents = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setData(filterHiddenDocuments(documents));
    };

    fetchData();
  }, []);

  // ... 나머지 컴포넌트 코드
};
