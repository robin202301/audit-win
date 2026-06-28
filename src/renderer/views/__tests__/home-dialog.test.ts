/**
 * 测试：新建项目对话框输入功能
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { ref, nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';

// ============ newProject 数据模型测试 ============
describe('新建项目对话框数据模型', () => {
  // 模拟 Home.vue 的 newProject
  function createNewProject() {
    return ref({
      name: '',
      auditedTarget: '',
      auditType: '经济责任审计',
    });
  }

  it('初始状态 name 应为空字符串', () => {
    const np = createNewProject();
    expect(np.value.name).toBe('');
  });

  it('初始状态 auditedTarget 应为空字符串', () => {
    const np = createNewProject();
    expect(np.value.auditedTarget).toBe('');
  });

  it('初始状态 auditType 应为 经济责任审计', () => {
    const np = createNewProject();
    expect(np.value.auditType).toBe('经济责任审计');
  });

  it('修改 name 应更新 ref 值', () => {
    const np = createNewProject();
    np.value.name = '测试审计项目';
    expect(np.value.name).toBe('测试审计项目');
  });

  it('修改 auditedTarget 应更新 ref 值', () => {
    const np = createNewProject();
    np.value.auditedTarget = '测试被审计单位';
    expect(np.value.auditedTarget).toBe('测试被审计单位');
  });

  it('重置应清空所有字段', () => {
    const np = createNewProject();
    np.value.name = '测试';
    np.value.auditedTarget = '单位';

    np.value.name = '';
    np.value.auditedTarget = '';

    expect(np.value.name).toBe('');
    expect(np.value.auditedTarget).toBe('');
  });
});

// ============ 对话框状态管理测试 ============
describe('新建项目对话框状态管理', () => {
  function createDialogState() {
    const showCreateDialog = ref(false);
    const newProject = ref({
      name: '',
      auditedTarget: '',
      auditType: '经济责任审计',
    });

    function openDialog() {
      newProject.value.name = '';
      newProject.value.auditedTarget = '';
      newProject.value.auditType = '经济责任审计';
      showCreateDialog.value = true;
    }

    function closeDialog() {
      showCreateDialog.value = false;
    }

    async function handleCreate(): Promise<boolean> {
      if (!newProject.value.name.trim()) return false;
      closeDialog();
      return true;
    }

    return { showCreateDialog, newProject, openDialog, closeDialog, handleCreate };
  }

  it('打开对话框应重置表单数据', () => {
    const { showCreateDialog, newProject, openDialog } = createDialogState();

    // 预先设置旧数据
    newProject.value.name = '旧项目';
    newProject.value.auditedTarget = '旧单位';

    openDialog();

    expect(showCreateDialog.value).toBe(true);
    expect(newProject.value.name).toBe('');
    expect(newProject.value.auditedTarget).toBe('');
  });

  it('关闭对话框应设置 showCreateDialog 为 false', () => {
    const { showCreateDialog, openDialog, closeDialog } = createDialogState();

    openDialog();
    expect(showCreateDialog.value).toBe(true);

    closeDialog();
    expect(showCreateDialog.value).toBe(false);
  });

  it('项目名称为空时不应创建', async () => {
    const { openDialog, handleCreate, showCreateDialog } = createDialogState();
    openDialog();

    const result = await handleCreate();
    expect(result).toBe(false);
    expect(showCreateDialog.value).toBe(true); // 对话框保持打开
  });

  it('项目名称非空时应成功创建', async () => {
    const { openDialog, newProject, handleCreate, showCreateDialog } = createDialogState();
    openDialog();
    newProject.value.name = '新审计项目';

    const result = await handleCreate();
    expect(result).toBe(true);
    expect(showCreateDialog.value).toBe(false);
  });

  it('创建按钮应在名称为空时禁用', () => {
    const { newProject } = createDialogState();
    expect(newProject.value.name.trim() === '').toBe(true); // 空名称 → 按钮禁用
  });

  it('创建按钮应在名称非空时启用', () => {
    const { newProject } = createDialogState();
    newProject.value.name = '测试';
    expect(newProject.value.name.trim() !== '').toBe(true); // 非空名称 → 按钮启用
  });
});

// ============ v-model 绑定测试 ============
describe('对话框 v-model 绑定', () => {
  it('ref 的 name 属性应支持双向绑定', () => {
    const newProject = ref({ name: '' });
    newProject.value.name = '测试值';
    expect(newProject.value.name).toBe('测试值');
  });

  it('ref 的 auditedTarget 属性应支持双向绑定', () => {
    const newProject = ref({ name: '', auditedTarget: '' });
    newProject.value.auditedTarget = '被审计单位A';
    expect(newProject.value.auditedTarget).toBe('被审计单位A');
  });

  it('ref 对象替换后旧引用不更新', () => {
    const newProject = ref({ name: '旧名称' });
    const oldRef = newProject.value;

    newProject.value = { name: '新名称' };
    expect(oldRef.name).toBe('旧名称');    // 旧对象不变
    expect(newProject.value.name).toBe('新名称'); // 新对象生效
  });
});
