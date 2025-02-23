export const filterHiddenDocuments = (documents) => {
  if (!Array.isArray(documents)) return documents;
  return documents.filter((doc) => !doc?.isHidden);
};
