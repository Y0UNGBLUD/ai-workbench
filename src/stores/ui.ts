import { defineStore } from 'pinia'
import { ref } from 'vue'

type Theme = 'dark' | 'light'
export const useUiStore = defineStore('ui', () => {
  // ===================================================
  // 📦 State
  // ===================================================
  const theme = ref<Theme | null>('light')
  const isLNBOpen = ref(false)

  // ===================================================
  // 🛠️ Actions
  // ===================================================
  function toggleLNB() {
    isLNBOpen.value = !isLNBOpen.value
  }
  function setTheme(v: Theme) {
    theme.value = v
    localStorage.setItem('workbench_theme', v)
  }
  function loadTheme() {
    const saved = localStorage.getItem('workbench_theme')
    if (saved === 'dark' || saved === 'light') {
      theme.value = saved
    }
  }
  // ===================================================
  // 😊 Return
  // ===================================================
  return {
    theme,
    isLNBOpen,
    toggleLNB,
    setTheme,
    loadTheme,
  }
})
