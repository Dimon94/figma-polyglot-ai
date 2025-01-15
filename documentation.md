# Figma Translator 技术文档

## 项目结构

```
src/
├── main/
│   ├── code.ts                 # 插件主入口
│   ├── service/
│   │   ├── translation/        # 翻译相关服务
│   │   │   ├── index.ts
│   │   │   ├── TranslationHistory.ts
│   │   │   └── TranslationProgressManager.ts
│   │   └── api/               # API 相关服务
│   └── utils/                 # 工具函数
├── ui/
│   ├── components/            # React 组件
│   │   ├── App.tsx
│   │   ├── Settings.tsx
│   │   └── translation/
│   ├── styles/               # 样式文件
│   └── index.tsx            # UI 入口
└── types/                   # 类型定义
```

## 核心模块说明

### 1. 翻译服务 (TranslationService)

```typescript
// 翻译配置接口
interface TranslationConfig {
    apiKey: string;
    apiEndpoint: string;
    modelName: string;
    provider: 'openai' | 'deepseek';
}

// 翻译服务类
class TranslationService {
    async translate(text: string, config: TranslationConfig): Promise<string>;
    validateConfig(config: TranslationConfig): boolean;
    handleError(error: Error): void;
}
```

### 2. 历史记录管理 (TranslationHistory)

```typescript
// 翻译记录接口
interface TranslationRecord {
    id: string;
    timestamp: number;
    parentNode: {
        id: string;
        name: string;
        type: string;
    };
    translations: TranslationItem[];
}

// 历史管理类
class TranslationHistory {
    static async addTranslationBatch(parent: BaseNode, translations: TranslationItem[]): Promise<void>;
    static async getHistory(): Promise<TranslationRecord[]>;
    static async searchHistory(query: string): Promise<TranslationRecord[]>;
    static async clearHistory(): Promise<void>;
}
```

### 3. 进度管理 (TranslationProgressManager)

```typescript
// 进度管理类
class TranslationProgressManager {
    initializeTasks(tasks: string[]): void;
    startTranslation(): void;
    updateProgress(taskId: string, success: boolean, error?: string): void;
    getProgress(): TranslationProgress;
}
```

## 开发指南

### 1. 环境设置

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建
npm run build

# 测试
npm run test
```

### 2. 代码规范

- 使用 TypeScript 强类型
- 遵循 ESLint 规则
- 使用 Prettier 格式化
- 添加必要的注释

### 3. 组件开发

```typescript
// React 组件示例
interface Props {
    onUpdate: (progress: number) => void;
    status: string;
}

const ProgressBar: React.FC<Props> = ({ onUpdate, status }) => {
    // 组件实现
};
```

### 4. 错误处理

```typescript
try {
    // 业务逻辑
} catch (error: any) {
    console.error('[Figma Translator]', error);
    figma.notify(`操作失败: ${error.message}`, { error: true });
}
```

## 测试指南

### 1. 单元测试

```typescript
describe('TranslationService', () => {
    it('should translate text correctly', async () => {
        // 测试实现
    });
});
```

### 2. 集成测试

```typescript
describe('Translation Flow', () => {
    it('should handle complete translation process', async () => {
        // 测试实现
    });
});
```

## 部署流程

1. 版本更新
   - 更新 package.json 版本号
   - 更新 manifest.json 版本号
   - 更新更新日志

2. 构建检查
   - 运行测试
   - 构建项目
   - 验证功能

3. 发布准备
   - 准备发布材料
   - 更新文档
   - 创建发布标签

## 故障排除

### 常见问题

1. 翻译失败
   - 检查 API 配置
   - 验证网络连接
   - 查看错误日志

2. 字体加载问题
   - 确保字体存在
   - 检查字体加载顺序
   - 验证字体权限

3. 节点匹配问题
   - 检查节点 ID
   - 验证节点类型
   - 调整匹配策略

## 性能优化

### 1. 代码优化
- 使用 React.memo 优化渲染
- 实现虚拟列表
- 优化状态更新

### 2. 资源优化
- 压缩资源文件
- 延迟加载组件
- 优化依赖大小 