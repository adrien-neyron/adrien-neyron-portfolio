// État partagé du lecteur audio ambiant (muted/unmuted).
// BackgroundMusic.vue gère l'élément <audio> ; SettingsGear.vue gère l'UI.
export const useBackgroundAudio = () => {
  const isMuted = useState('bg-audio-muted', () => true)
  return { isMuted }
}
