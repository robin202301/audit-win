/**
 * 测试：送达回证日期校验 + 空表单保存 + saveSuccess 替换 alert
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ref } from 'vue';

// 模拟 GenericStageForm 的校验逻辑
function createValidateDateField(
  stepKey: string,
  noticeSaveDate: string | null,
  formData: Record<string, string>,
  configFields: { key: string; label: string; type?: string }[]
) {
  let error: string | null = null;

  function validateDateField(_fieldKey: string): void {
    if (stepKey === 'notice') return;
    if (!noticeSaveDate) return;

    const noticeDate = new Date(noticeSaveDate);
    const dateFields = configFields.filter(f => f.type === 'date');
    for (const field of dateFields) {
      // 送达回证的送达日期应早于审计开始日期，走专属校验逻辑
      if (stepKey === 'delivery_receipt' && field.key === 'deliveryDate') continue;
      const val = formData[field.key];
      if (val && new Date(val) < noticeDate) {
        error = `${field.label} 不能早于审计通知书的审计开始日期`;
        return;
      }
    }

    // 送达回证：送达日期须在审计开始日期前至少3天
    if (stepKey === 'delivery_receipt') {
      const deliveryVal = formData['deliveryDate'];
      if (deliveryVal) {
        const diff = noticeDate.getTime() - new Date(deliveryVal).getTime();
        const daysDiff = diff / (1000 * 60 * 60 * 24);
        if (daysDiff < 3) {
          error = '送达日期须在审计开始日期前至少3天';
          return;
        }
      }
    }

    error = null;
  }

  return { validateDateField, getError: () => error };
}

// 模拟空数据检测逻辑
function hasContent(parsed: Record<string, unknown>): boolean {
  return Object.values(parsed).some(v => v && String(v).trim() !== '');
}

// 模拟 saveSuccess 行为
function createSaveManager() {
  const hasSavedData = ref(false);
  const isEditing = ref(true);
  const saveSuccess = ref(false);

  function handleSave(formData: Record<string, string>) {
    const contentExists = hasContent(formData);
    if (contentExists) {
      hasSavedData.value = true;
      isEditing.value = false;
      saveSuccess.value = true;
      // setTimeout 在测试中由 vi.advanceTimers 控制
    }
  }

  function doEdit() {
    isEditing.value = true;
    saveSuccess.value = false;
  }

  return { hasSavedData, isEditing, saveSuccess, handleSave, doEdit };
}

// ============ 送达回证日期校验测试 ============
describe('送达回证日期校验', () => {
  const deliveryFields = [
    { key: 'documentName', label: '文书名称' },
    { key: 'deliveryDate', label: '送达日期', type: 'date' },
    { key: 'content', label: '备注内容' },
  ];

  it('送达日期早于审计开始日期 ≥3 天应通过校验', () => {
    const formData = { deliveryDate: '2025-04-30' }; // 4/30
    const noticeDate = '2025-05-05';                  // 5/5, 相差5天

    const { validateDateField, getError } = createValidateDateField(
      'delivery_receipt', noticeDate, formData, deliveryFields
    );

    validateDateField('deliveryDate');
    expect(getError()).toBeNull();
  });

  it('送达日期早于审计开始日期但不足3天应报错', () => {
    const formData = { deliveryDate: '2025-05-03' }; // 5/3
    const noticeDate = '2025-05-05';                  // 5/5, 相差2天

    const { validateDateField, getError } = createValidateDateField(
      'delivery_receipt', noticeDate, formData, deliveryFields
    );

    validateDateField('deliveryDate');
    expect(getError()).toBe('送达日期须在审计开始日期前至少3天');
  });

  it('送达日期晚于审计开始日期应报错', () => {
    const formData = { deliveryDate: '2025-05-10' }; // 晚于5/5
    const noticeDate = '2025-05-05';

    const { validateDateField, getError } = createValidateDateField(
      'delivery_receipt', noticeDate, formData, deliveryFields
    );

    validateDateField('deliveryDate');
    expect(getError()).toBe('送达日期须在审计开始日期前至少3天');
  });

  it('送达日期等于审计开始日期应报错', () => {
    const formData = { deliveryDate: '2025-05-05' };
    const noticeDate = '2025-05-05';

    const { validateDateField, getError } = createValidateDateField(
      'delivery_receipt', noticeDate, formData, deliveryFields
    );

    validateDateField('deliveryDate');
    expect(getError()).toBe('送达日期须在审计开始日期前至少3天');
  });

  it('送达日期早于审计开始日期恰好3天应通过', () => {
    const formData = { deliveryDate: '2025-05-02' }; // 5/2
    const noticeDate = '2025-05-05';                  // 5/5, 相差3天

    const { validateDateField, getError } = createValidateDateField(
      'delivery_receipt', noticeDate, formData, deliveryFields
    );

    validateDateField('deliveryDate');
    expect(getError()).toBeNull();
  });

  it('送达回证的通用日期字段（非 deliveryDate）不应被跳过', () => {
    // 假设 delivery_receipt 有其他日期字段（如未来的扩展）
    const fields = [
      ...deliveryFields,
      { key: 'otherDate', label: '其他日期', type: 'date' },
    ];
    const formData = {
      deliveryDate: '2025-04-30',
      otherDate: '2025-04-01', // 早于审计开始日期
    };
    const noticeDate = '2025-05-05';

    const { validateDateField, getError } = createValidateDateField(
      'delivery_receipt', noticeDate, formData, fields
    );

    validateDateField('otherDate');
    expect(getError()).toBe('其他日期 不能早于审计通知书的审计开始日期');
  });
});

// ============ 空表单检测测试 ============
describe('空表单保存不锁定只读', () => {
  it('全部字段为空应返回 false（无内容）', () => {
    expect(hasContent({ name: '', unit: '', date: '' })).toBe(false);
  });

  it('全部字段为纯空格应返回 false', () => {
    expect(hasContent({ name: '   ', unit: '  ' })).toBe(false);
  });

  it('至少有一个非空字段应返回 true', () => {
    expect(hasContent({ name: '', unit: '审计局', date: '' })).toBe(true);
  });

  it('混合空值和非空值应返回 true', () => {
    expect(hasContent({ name: '项目A', unit: '', date: '' })).toBe(true);
  });

  it('字符串 "0" 应被视为有效内容', () => {
    // 表单字段均为字符串类型，"0" 是有效输入
    expect(hasContent({ count: '0', name: '' })).toBe(true);
  });

  it('空白字符串和空字符串混合应返回 false', () => {
    expect(hasContent({ name: '', unit: '   ', date: '' })).toBe(false);
  });

  it('null 和 undefined 不应被视为有效内容', () => {
    expect(hasContent({ name: null, unit: undefined } as any)).toBe(false);
  });
});

// ============ saveSuccess 替换 alert 测试 ============
describe('saveSuccess 替换 alert', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('保存成功应设置 saveSuccess 为 true', () => {
    const { saveSuccess, handleSave } = createSaveManager();
    handleSave({ name: '测试项目', unit: '测试单位' });

    expect(saveSuccess.value).toBe(true);
  });

  it('保存有内容的数据应设置 hasSavedData 和 saveSuccess', () => {
    const { hasSavedData, isEditing, saveSuccess, handleSave } = createSaveManager();
    handleSave({ name: '测试项目' });

    expect(hasSavedData.value).toBe(true);
    expect(isEditing.value).toBe(false);
    expect(saveSuccess.value).toBe(true);
  });

  it('保存空数据不应设置 hasSavedData 和 saveSuccess', () => {
    const { hasSavedData, isEditing, saveSuccess, handleSave } = createSaveManager();
    handleSave({ name: '', unit: '' });

    expect(hasSavedData.value).toBe(false);
    expect(isEditing.value).toBe(true);
    expect(saveSuccess.value).toBe(false);
  });

  it('点击修改应清除 saveSuccess', () => {
    const { saveSuccess, handleSave, doEdit } = createSaveManager();
    handleSave({ name: '测试' });
    expect(saveSuccess.value).toBe(true);

    doEdit();
    expect(saveSuccess.value).toBe(false);
  });
});
