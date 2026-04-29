<template>
  <div class="min-h-screen flex flex-col gov-layout">
    <header class="gov-header">
      <div class="gov-header-inner">
        <div class="flex items-center gap-3">
          <img src="../../public/logo.png" alt="国徽" class="gov-logo" />
          <div class="gov-title-group">
            <h1 class="gov-title">基层审计机关审计辅助系统</h1>
            <p class="gov-subtitle">科右前旗审计局</p>
          </div>
        </div>
        <button
          v-if="$route.path !== '/'"
          class="gov-back-btn"
          @click="$router.push('/')"
        >
          <svg class="w-4 h-4 mr-1" viewBox="0 0 16 16" fill="currentColor">
            <path d="M10 12L6 8l4-4v8z"/>
          </svg>
          返回首页
        </button>
      </div>
      <div class="gov-header-decoration"></div>
    </header>
    <main class="flex-1 gov-main">
      <router-view :key="$route.fullPath" />
    </main>
    <footer class="gov-footer">
      <p>基层审计机关审计辅助系统 &copy; {{ currentYear }} 科右前旗审计局</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
const currentYear = new Date().getFullYear();
</script>

<style>
/* 政府风格布局 */
.gov-layout {
  background-color: #f5f0e8;
  background-image:
    repeating-linear-gradient(
      90deg,
      transparent 0px,
      transparent 48px,
      rgba(180, 40, 20, 0.03) 48px,
      rgba(180, 40, 20, 0.03) 50px
    ),
    repeating-linear-gradient(
      0deg,
      transparent 0px,
      transparent 48px,
      rgba(180, 40, 20, 0.02) 48px,
      rgba(180, 40, 20, 0.02) 50px
    );
}

/* 政府风格头部 */
.gov-header {
  background: linear-gradient(135deg, #8B0000 0%, #B22222 50%, #8B0000 100%);
  color: #FFD700;
  box-shadow: 0 4px 20px rgba(139, 0, 0, 0.4);
  position: relative;
  overflow: hidden;
}

.gov-header-inner {
  max-width: 7xl;
  margin: 0 auto;
  padding: 12px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  z-index: 2;
}

/* 华表柱装饰纹理 */
.gov-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image:
    /* 华表柱纹理 */
    repeating-linear-gradient(
      90deg,
      transparent 0px,
      transparent 60px,
      rgba(255, 215, 0, 0.08) 60px,
      rgba(255, 215, 0, 0.08) 62px,
      transparent 62px,
      transparent 120px
    ),
    /* 云纹装饰 */
    radial-gradient(ellipse at 10% 50%, rgba(255, 215, 0, 0.1) 0%, transparent 50%),
    radial-gradient(ellipse at 90% 50%, rgba(255, 215, 0, 0.1) 0%, transparent 50%);
  pointer-events: none;
}

/* 金色底部装饰线 */
.gov-header-decoration {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg,
    transparent 0%,
    #FFD700 10%,
    #FFD700 90%,
    transparent 100%
  );
  opacity: 0.8;
}

.gov-logo {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 2px solid rgba(255, 215, 0, 0.6);
  box-shadow: 0 0 12px rgba(255, 215, 0, 0.3);
  background: white;
  padding: 2px;
}

.gov-title-group {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.gov-title {
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 4px;
  color: #FFD700;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  margin: 0;
}

.gov-subtitle {
  font-size: 13px;
  color: rgba(255, 215, 0, 0.8);
  letter-spacing: 2px;
  margin: 0;
}

.gov-back-btn {
  display: flex;
  align-items: center;
  padding: 6px 16px;
  background: rgba(255, 215, 0, 0.15);
  border: 1px solid rgba(255, 215, 0, 0.4);
  border-radius: 6px;
  color: #FFD700;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.gov-back-btn:hover {
  background: rgba(255, 215, 0, 0.25);
  border-color: rgba(255, 215, 0, 0.7);
}

/* 主内容区 */
.gov-main {
  background: transparent;
}

/* 页脚 */
.gov-footer {
  background: linear-gradient(135deg, #8B0000 0%, #B22222 50%, #8B0000 100%);
  color: rgba(255, 215, 0, 0.7);
  text-align: center;
  padding: 10px 0;
  font-size: 12px;
  letter-spacing: 1px;
  position: relative;
}

.gov-footer::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg,
    transparent 0%,
    #FFD700 20%,
    #FFD700 80%,
    transparent 100%
  );
  opacity: 0.6;
}
</style>