<template>
  <div class="max-w-3xl mx-auto px-4 py-8">
    <div class="flex items-center gap-2 text-sm text-gray-500 mb-4">
      <button class="hover:text-blue-600" @click="goBack">返回列表</button>
      <span>/</span>
      <span class="text-gray-800 font-medium">全局设置</span>
    </div>

    <div class="card gov-settings-card">
      <h2 class="gov-settings-title">全局默认值设置</h2>
      <p class="gov-settings-desc">以下设置将在所有审计项目的审计通知书等公文中自动填充，不可在项目中单独修改。</p>

      <div v-if="saving" class="gov-loading-row">
        <svg class="w-4 h-4 animate-spin" viewBox="0 0 16 16" fill="currentColor">
          <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="2" fill="none" stroke-dasharray="20 12"/>
        </svg>
        <span>保存中...</span>
      </div>

      <div v-if="saveSuccess" class="gov-success-msg">设置已保存</div>

      <div class="gov-settings-form">
        <div v-for="field in settingFields" :key="field.key" class="gov-setting-group">
          <label class="gov-setting-label">{{ field.label }}</label>
          <textarea
            v-if="field.type === 'textarea'"
            v-model="settings[field.key]"
            class="gov-setting-input"
            :placeholder="field.placeholder"
            :rows="field.rows || 3"
          />
          <input
            v-else
            v-model="settings[field.key]"
            class="gov-setting-input"
            :placeholder="field.placeholder"
          />
        </div>

        <div class="gov-setting-actions">
          <button class="gov-btn-save" @click="handleSave">保存设置</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const settingFields = [
  { key: 'auditCommitteeOffice', label: '审计委员会办公室', placeholder: '例：中共科右前旗委审计委员会办公室' },
  { key: 'auditOrg', label: '审计机关全称', placeholder: '例：科右前旗审计局' },
  { key: 'issuingOrg', label: '印发机关', placeholder: '例：中共科右前旗委审计委员会办公室 科右前旗审计局' },
  { key: 'content', label: '附件内容', type: 'textarea', rows: 5, placeholder: '审计通知书附件内容' },
];

const settings = reactive<Record<string, string>>({});
const saving = ref(false);
const saveSuccess = ref(false);

for (const f of settingFields) {
  settings[f.key] = '';
}

onMounted(async () => {
  try {
    const res = await window.electronAPI.settings.getAll();
    if (res.success && res.data) {
      for (const f of settingFields) {
        settings[f.key] = res.data[f.key] || '';
      }
    }
  } catch {
    // ignore
  }
});

async function handleSave(): Promise<void> {
  saving.value = true;
  saveSuccess.value = false;
  try {
    for (const f of settingFields) {
      await window.electronAPI.settings.set(f.key, settings[f.key]);
    }
    saveSuccess.value = true;
    setTimeout(() => { saveSuccess.value = false; }, 3000);
  } catch (e: unknown) {
    alert('保存失败：' + (e as Error).message);
  } finally {
    saving.value = false;
  }
}

function goBack(): void {
  router.push({ name: 'home' });
}
</script>

<style scoped>
.gov-settings-card {
  background: linear-gradient(135deg, #fff 0%, #fffaf5 100%);
  border: 1px solid #e8d5b7;
  border-left: 4px solid #8B0000;
  border-radius: 8px;
  padding: 24px;
}

.gov-settings-title {
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 8px;
}

.gov-settings-desc {
  font-size: 13px;
  color: #6b7280;
  margin: 0 0 24px;
}

.gov-loading-row {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #8B0000;
  margin-bottom: 16px;
}

.gov-success-msg {
  background: #dcfce7;
  border: 1px solid #86efac;
  color: #166534;
  padding: 8px 12px;
  border-radius: 6px;
  margin-bottom: 16px;
  font-size: 13px;
}

.gov-settings-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.gov-setting-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.gov-setting-label {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.gov-setting-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  color: #1f2937;
  background: #faf8f5;
  transition: border-color 0.2s;
  font-family: inherit;
}

.gov-setting-input:focus {
  outline: none;
  border-color: #8B0000;
  box-shadow: 0 0 0 3px rgba(139, 0, 0, 0.1);
}

.gov-setting-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
}

.gov-btn-save {
  padding: 8px 24px;
  background: linear-gradient(135deg, #8B0000, #B22222);
  color: #FFD700;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 2px 4px rgba(139, 0, 0, 0.2);
}

.gov-btn-save:hover {
  background: linear-gradient(135deg, #a00000, #c42828);
  transform: translateY(-1px);
}
</style>
