<template>
  <div class="welcome">
    <div class="hero">
      <h1 class="title">{{ title }}</h1>
      <p class="subtitle">前后端分离工程模板 · 已配置 AI 工程化协作</p>
      <div class="meta">
        <el-tag size="small" effect="plain">版本 {{ version }}</el-tag>
        <el-tag size="small" effect="plain" type="info">Spring Boot + Vue 3 + TypeScript</el-tag>
      </div>
    </div>

    <el-row :gutter="16" class="grid">
      <el-col :xs="24" :md="12">
        <el-card shadow="never" class="card">
          <template #header><span class="card-title">三步跑起来</span></template>
          <ol class="steps">
            <li v-for="step in quickStart" :key="step.label">
              <div class="step-label">{{ step.label }}</div>
              <code class="cmd">{{ step.cmd }}</code>
            </li>
          </ol>
        </el-card>
      </el-col>

      <el-col :xs="24" :md="12">
        <el-card shadow="never" class="card">
          <template #header><span class="card-title">常用入口</span></template>
          <div class="links">
            <router-link v-for="entry in entries" :key="entry.path" :to="entry.path" class="link">
              <el-icon class="link-icon"><component :is="entry.icon" /></el-icon>
              <span>{{ entry.label }}</span>
            </router-link>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="never" class="card">
      <template #header><span class="card-title">项目约定</span></template>
      <ul class="notes">
        <li>
          <b>工程约定</b>在仓库根目录的 <code>CLAUDE.md</code>（索引 + 铁律）与
          <code>docs/README.md</code>（总目录），改动前先读。
        </li>
        <li>
          <b>新增业务模块</b>优先走<strong>代码生成器</strong>（系统工具 → 代码生成），
          别手写 CRUD——手写必漏菜单权限、字典、分页这些配套设施。
        </li>
        <li>
          <b>主题换肤</b>只需在 <code>src/config/themes.ts</code> 的 <code>THEME_PRESETS</code>
          里加一个对象，不用动其他文件。
        </li>
        <li>
          <b>改后端代码必须重新 <code>mvn install</code> 再重启 jar</b>——直接重启 jar 不会生效。
        </li>
      </ul>
    </el-card>
  </div>
</template>

<script setup lang="ts" name="Index">
import settings from '@/settings'

const title = ref<string>(settings.title || '')
const version = ref<string>(import.meta.env.VITE_APP_VERSION || '—')

const quickStart = [
  { label: '① 中间件（MySQL + Redis）', cmd: 'docker compose -f deploy/docker-compose.yml up -d' },
  { label: '② 后端（打包后启动，需在仓库根目录运行）', cmd: 'mvn -f backend/pom.xml clean install -DskipTests' },
  { label: '③ 前端', cmd: 'pnpm -C frontend dev' }
]

const entries = [
  { label: '用户管理', path: '/system/user', icon: 'User' },
  { label: '角色管理', path: '/system/role', icon: 'UserFilled' },
  { label: '菜单管理', path: '/system/menu', icon: 'Menu' },
  { label: '字典管理', path: '/system/dict', icon: 'Collection' },
  { label: '代码生成', path: '/tool/gen', icon: 'Tools' },
  { label: '在线用户', path: '/monitor/online', icon: 'Monitor' }
]
</script>

<style scoped lang="scss">
.welcome {
  padding: 20px;
  min-height: 100%;
  background: var(--el-bg-color-page, #f5f7fa);
}

.hero {
  margin-bottom: 20px;
}

.title {
  margin: 0 0 8px;
  font-size: 26px;
  font-weight: 600;
  color: var(--el-text-color-primary, #303133);
}

.subtitle {
  margin: 0 0 14px;
  font-size: 14px;
  color: var(--el-text-color-secondary, #909399);
}

.meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.grid {
  margin-bottom: 0;
}

.card {
  margin-bottom: 16px;
  border-color: var(--el-border-color-lighter, #ebeef5);
}

.card-title {
  font-weight: 600;
  color: var(--el-text-color-primary, #303133);
}

.steps {
  margin: 0;
  padding-left: 20px;

  li {
    margin-bottom: 14px;

    &:last-child {
      margin-bottom: 0;
    }
  }
}

.step-label {
  margin-bottom: 6px;
  font-size: 13px;
  color: var(--el-text-color-regular, #606266);
}

.cmd {
  display: block;
  padding: 8px 10px;
  border-radius: 4px;
  font-family: Consolas, Monaco, 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.6;
  // 命令行块在两个主题下都要能读：用 Element Plus 的填充色令牌，而不是写死浅灰
  background: var(--el-fill-color-light, #f5f7fa);
  color: var(--el-text-color-primary, #303133);
  border: 1px solid var(--el-border-color-lighter, #ebeef5);
  overflow-x: auto;
  white-space: nowrap;
}

.links {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 10px;
}

.link {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 4px;
  font-size: 14px;
  text-decoration: none;
  color: var(--el-text-color-regular, #606266);
  background: var(--el-fill-color-light, #f5f7fa);
  border: 1px solid var(--el-border-color-lighter, #ebeef5);
  transition: all 0.2s;

  &:hover {
    color: var(--el-color-primary);
    border-color: var(--el-color-primary);
  }
}

.link-icon {
  color: var(--el-color-primary);
}

.notes {
  margin: 0;
  padding-left: 20px;
  font-size: 14px;
  line-height: 1.9;
  color: var(--el-text-color-regular, #606266);

  code {
    padding: 1px 5px;
    border-radius: 3px;
    font-family: Consolas, Monaco, 'Courier New', monospace;
    font-size: 12px;
    background: var(--el-fill-color, #f0f2f5);
    color: var(--el-text-color-primary, #303133);
  }

  b {
    color: var(--el-text-color-primary, #303133);
  }
}
</style>
