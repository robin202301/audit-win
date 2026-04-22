<template>
  <div class="min-h-screen flex flex-col">
    <header class="bg-blue-700 text-white shadow-lg">
      <div class="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <svg class="w-8 h-8" viewBox="0 0 32 32" fill="none">
            <rect x="2" y="4" width="28" height="24" rx="2" stroke="currentColor" stroke-width="2"/>
            <path d="M8 12h16M8 18h12M8 24h8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          <h1 class="text-xl font-bold">审计管理系统</h1>
        </div>
        <button
          v-if="$route.path !== '/'"
          class="text-sm bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded transition-colors"
          @click="$router.push('/')"
        >
          返回首页
        </button>
      </div>
    </header>
    <main class="flex-1">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
</script>
