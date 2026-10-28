export default defineNuxtPlugin(() => {
  const { clear } = useBlobTrash();
  // Les enregistrements appellent commit() avant de naviguer ; toute autre navigation abandonne la file (rien n'est supprimé).
  useRouter().beforeEach(() => { clear(); });
});
