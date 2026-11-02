// État partagé de la scène de fond (animée / figée).
// AppBackground.vue écoute isPaused ; ToolsList.vue le bascule.
export const useSceneState = () => {
  const isPaused = useState('scene-paused', () => false)
  return { isPaused }
}
