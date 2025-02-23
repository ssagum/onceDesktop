import { filterHiddenDocuments } from "../utils/filterUtils";

export const useFirestore = () => {
  const fetchCollection = async (collectionName) => {
    const querySnapshot = await getDocs(collection(db, collectionName));
    const documents = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    return filterHiddenDocuments(documents);
  };

  const deleteDocument = async (collectionName, documentId) => {
    const docRef = doc(db, collectionName, documentId);
    await updateDoc(docRef, {
      isHidden: true,
      hiddenAt: serverTimestamp(),
    });
  };

  return { fetchCollection, deleteDocument };
};
