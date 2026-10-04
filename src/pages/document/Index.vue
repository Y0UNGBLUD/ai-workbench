<template>
  <div class="page-document">
    <div class="page-document__inner">
      <h1 class="page-document__title">문서 분석</h1>
      <FormSearch
        v-model="filter.keyword"
        @enter="fetchList"
        placeholder="파일명"
        class="page-document__search" />
      <AsyncState
        :loading="isShowSkeleton || !isListFirstLoaded"
        :empty="isEmpty"
        :error="listError">
        <template #skeleton>
          <SkeletonList />
        </template>
        <template #default>
          <p class="page-document__total">
            총 <b>{{ pagination.totalElements }}</b
            >개의 문서가 있습니다.
          </p>
          <q-list dense bordered class="page-document__list">
            <q-item
              v-for="item in list"
              :key="item.id"
              clickable
              :to="`/document/${item.id}`"
              class="page-document__item">
              <span class="page-document__item-title">
                {{ item.title }}
              </span>
              <div class="q-ml-auto">
                <span class="page-document__item-time">
                  {{ dayjs(item.createdAt).format('YYYY년 MM월 DD일 A h:mm') }}
                </span>
                <BaseButton
                  color="transparent"
                  rounded
                  dense
                  size="sm"
                  @click.prevent="onClickDeleteItem(item)"
                  class="q-ml-xs"
                  ><q-icon name="clear" color="dark"
                /></BaseButton>
              </div>
            </q-item>
          </q-list>
          <Pagination
            v-model="pagination.page"
            :max="pagination.totalPages"
            class="page-document__pagination" />
        </template>
        <template #empty>
          <EmptyState />
        </template>
        <template #error>
          <ErrorState @retry="fetchList" />
        </template>
      </AsyncState>
    </div>

    <Confirm
      title="문서 삭제"
      v-model="dialogs.documentDelete"
      :loading="isDeleteLoading"
      :close-on-confirm="false"
      @confirm="handleDeleteItem"
      @close="selectedItem = null">
      <p v-if="selectedItem">
        <b>{{ selectedItem?.title }}</b>
      </p>
      <p>선택한 문서를 삭제하시겠습니까?</p>
    </Confirm>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { QList, QItem, QIcon } from 'quasar'

// ===================================================
// 🧩 Components
// ===================================================
import AsyncState from '@/components/feedback/AsyncState.vue'
import EmptyState from '@/components/feedback/EmptyState.vue'
import ErrorState from '@/components/feedback/ErrorState.vue'
import SkeletonList from '@/components/feedback/SkeletonList.vue'
import Pagination from '@/components/common/Pagination.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import Confirm from '@/components/dialog/Confirm.vue'
import FormSearch from '@/components/form/FormSearch.vue'

// ===================================================
// 📐 Types / Interfaces
// ===================================================
import type { StoredDocument } from '@/types/models/document.model'

// ===================================================
// 📖 External Library
// ===================================================
import dayjs from '@/libs/dayjs.ts'

// ===================================================
// 🌐 API / Server Data
// ===================================================
import { getDocumentList, deleteDocument } from '@/api/document/document.api'

// ===================================================
// 🪝 Composables / Hooks
// ===================================================
import { useLoading } from '@/composables/ui/useLoading'
import { useDialog } from '@/composables/ui/useDialog'
import { useList } from '@/composables/data/useList'
const { isLoading: isDeleteLoading, withLoading } = useLoading()
const { showDialog, closeDialog, dialogs } = useDialog()

const {
  list,
  listError,
  pagination,
  fetchList,
  resetPageAndFetch,
  isShowSkeleton,
  isListFirstLoaded,
  isEmpty,
  filter,
} = useList({
  fetchApi: (params) => getDocumentList({ ...params }),
  usePagination: true,
  useFilter: true,
  initialFilter: {
    keyword: '',
  },
})

// ===================================================
// 📦 State
// ===================================================
const selectedItem = ref<StoredDocument | null>(null)

// ===================================================
// 🛠️ Actions
// ===================================================
const handleDeleteItem = () => {
  const item = selectedItem.value
  if (!item) return
  withLoading(async () => {
    await deleteDocument({
      id: item.id,
    }).then(() => {
      closeDialog('documentDelete')
      resetPageAndFetch()
    })
  })
}

// ===================================================
// ⚙️ Methods
// ===================================================
const onClickDeleteItem = (item: StoredDocument) => {
  selectedItem.value = item
  showDialog('documentDelete')
}

// ===================================================
// 🚀 Lifecycle Hooks
// ===================================================
onMounted(() => {
  fetchList()
})
</script>
<style lang="scss" scoped>
.page-document {
  &__inner {
    max-width: 720px;
    margin: auto;
    padding: 40px 0;
  }
  &__title {
    font-size: mixin.rem(24px);
    font-weight: 700;
    margin-bottom: 16px;
  }
  &__search {
    margin-bottom: 16px;
  }
  &__total {
    color: var(--color-text-secondary);
    margin-bottom: 8px;
  }
  &__list {
    background: var(--color-surface);
  }
  &__item {
    display: flex;
    align-items: center;
    font-size: mixin.rem(16px);
    padding: 8px 12px;
    padding: 8px 12px;
  }
  &__item-title {
    font-weight: 500;
  }
  &__item-time {
    font-size: mixin.rem(13px);
    color: var(--color-text-secondary);
  }
  &__pagination {
    margin-top: 16px;
  }
}
</style>
