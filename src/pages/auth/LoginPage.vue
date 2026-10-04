<template>
  <div class="page-login">
    <div class="page-login__inner">
      <h1 class="page-login__title">Login</h1>
      <q-form @submit="handleLogin" class="page-login__form">
        <FormInput
          v-model="form.username"
          label="아이디"
          placeholder="아이디"
          :disable="isLoading"
          :has-error="!!errors.username"
          :error-msg="errors.username"
          class="page-login__input page-login__input--id" />
        <FormInput
          v-model="form.password"
          label="비밀번호"
          placeholder="****"
          type="password"
          :disable="isLoading"
          :has-error="!!errors.password"
          :error-msg="errors.password"
          class="page-login__input page-login__input--password" />

        <q-checkbox
          v-model="isRememberUsername"
          size="sm"
          label="아이디 저장"
          color="secondary"
          class="page-login__remember" />
        <BaseButton
          color="primary"
          type="submit"
          :loading="isLoading"
          class="page-login__submit"
          >Login</BaseButton
        >
      </q-form>
      <p v-if="loginErrorMsg" class="page-login__error-msg">
        {{ loginErrorMsg }}
      </p>
    </div>
  </div>
</template>
<script setup lang="ts">
// ===================================================
// 📦 Imports
// ===================================================
import { ref } from 'vue'
import { useRouter } from 'vue-router'
const router = useRouter()

// ===================================================
// 🌐 API / Server Data
// ===================================================
import { login } from '@/api/common/auth.api'

// ===================================================
// 🧩 Components
// ===================================================
import FormInput from '@/components/form/FormInput.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import { QForm, QCheckbox } from 'quasar'

// ===================================================
// 📖 External Library
// ===================================================
import axios from 'axios'
import Cookies from 'universal-cookie'
const cookies = new Cookies()
// ===================================================
// 📦 State
// ===================================================
const loginErrorMsg = ref('')
const SAVED_USERNAME_KEY = 'saved_username'
const savedUsername = cookies.get<string>(SAVED_USERNAME_KEY)
const isRememberUsername = ref(!!savedUsername)

// ===================================================
// 🪝 Composables / Hooks
// ===================================================
import { useUserStore } from '@/stores/user'
import { useLoading } from '@/composables/ui/useLoading'
import { useFormState } from '@/composables/form/useFormState'
const userStore = useUserStore()
const { isLoading, withLoading } = useLoading()
const { form, errors, resetForm, validate } = useFormState<{
  username: string
  password: string
}>(
  {
    username: savedUsername ?? '',
    password: '',
  },
  {
    username: [(v) => (!v ? '아이디를 입력하세요' : null)],
    password: [(v) => (!v ? '비밀번호를 입력하세요' : null)],
  },
)

// ===================================================
// 🛠️ Actions
// ===================================================
const handleLogin = async () => {
  loginErrorMsg.value = ''
  if (!validate()) return
  await withLoading(async () => {
    try {
      const res = await login(form)
      const { accessToken, user } = res

      userStore.login(accessToken, user)
      await userStore.handleGetUserInfo()

      if (isRememberUsername.value) {
        cookies.set(SAVED_USERNAME_KEY, form.username, {
          maxAge: 60 * 60 * 24 * 30,
          path: '/',
        })
      } else {
        cookies.remove(SAVED_USERNAME_KEY, {
          path: '/',
        })
      }

      resetForm()
      void router.push('/document')
    } catch (err: unknown) {
      console.log(err)
      if (axios.isAxiosError(err)) {
        if (err.code === 'ECONNABORTED') {
          loginErrorMsg.value = '로그인에 실패했습니다.'
        } else if (err.code === 'ERR_BAD_REQUEST') {
          loginErrorMsg.value = '로그인 요청에 실패했습니다.'
        } else {
          loginErrorMsg.value = '아이디 또는 비밀번호가 올바르지 않습니다.'
        }
      } else {
        loginErrorMsg.value = '알 수 없는 오류가 발생했습니다.'
      }
    }
  })
}
</script>
<style lang="scss" scoped>
.page-login {
  &__inner {
    max-width: 480px;
    margin: auto;
    padding: 120px 0;
  }
  &__title {
    font-weight: 700;
    font-size: mixin.rem(32px);
    margin-bottom: 16px;
  }
  &__form {
  }
  &__input {
    margin-bottom: 16px;
  }
  &__remember {
    margin-bottom: 8px;
  }
  &__submit {
    width: 100%;
    padding: 12px 0;
    :deep(.q-btn__content) {
      font-size: mixin.rem(16px);
    }
  }
  &__error-msg {
    margin-top: 8px;
    color: var(--color-negative);
  }
}
</style>
