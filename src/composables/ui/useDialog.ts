import { reactive } from 'vue'

const dialogs = reactive<Record<string, boolean>>({})
/**
 * Dialog 상태를 관리하는 공용 컴포저블.
 *
 * @returns {{
 *   showDialog: (name: string) => void,
 *   closeDialog: (name: string) => void,
 *   toggleDialog: (name: string) => void,
 *   isOpenDialog: (name: string) => boolean,
 *   dialogs: import('vue').Readonly<import('vue').Ref<Record<string, boolean>>>
 * }}
 *
 * @example
 * ```ts
 * <script setup lang="ts">
 * const { showDialog, closeDialog, toggleDialog, isOpenDialog, dialogs } = useDialog()
 *
 * showDialog('selectDocDialog')       // 'selectDocDialog' 다이얼로그 열기
 * closeDialog('selectDocDialog')       // 'selectDocDialog' 다이얼로그 닫기
 * toggleDialog('userManageDialog')    // 'userManageDialog' 다이얼로그 열기/닫기 토글
 * if (isOpenDialog('noticeDialog')) console.log('공지 다이얼로그 열림')
 * </script>
 *
 * ```
 * ```vue
 * <template>
 *  <Confirm v-model="dialogs.confirm" />
 *  <DocSelectDialog v-model="dialogs['docSelectDialog']" />
 * </template>
 * ```
 */
export function useDialog() {
  /**
   * 지정한 다이얼로그를 열기
   * @param {string} name - 다이얼로그 이름
   */
  function showDialog(name: string) {
    dialogs[name] = true
  }
  /**
   * 지정한 다이얼로그 닫기
   * @param {string} name - 다이얼로그 이름
   */
  function closeDialog(name: string) {
    dialogs[name] = false
  }
  /**
   * 지정한 다이얼로그 토글 (열려있으면 닫고, 닫혀있으면 열기)
   * @param {string} name - 다이얼로그 이름
   */
  function toggleDialog(name: string) {
    dialogs[name] = !dialogs[name]
  }

  /**
   * 지정한 다이얼로그이 열려 있는지 확인
   * @param {string} name - 다이얼로그 이름
   * @returns {boolean} 열려있으면 true, 아니면 false
   */
  function isOpenDialog(name: string) {
    return !!dialogs[name]
  }
  /**
   * 모든 다이얼로그 닫기
   */
  function closeAllDialogs() {
    Object.keys(dialogs).forEach((key) => {
      dialogs[key] = false
    })
  }
  return {
    showDialog,
    closeDialog,
    toggleDialog,
    isOpenDialog,
    closeAllDialogs,
    dialogs,
  }
}
