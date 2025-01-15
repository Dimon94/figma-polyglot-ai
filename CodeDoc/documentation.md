# 技术文档

## 1. 技术架构

### 1.1 技术栈选型
- TypeScript：主要开发语言
- React：UI组件开发
- Figma Plugin API：插件接口调用
- OpenAI API：翻译服务
- Jest：单元测试框架
- Webpack：构建打包工具

### 1.2 系统架构
```
src/
├── main/              # 插件主程序
│   ├── controller/    # 控制器层
│   ├── service/       # 业务逻辑层
│   └── utils/         # 工具函数
├── ui/                # 用户界面
│   ├── components/    # UI组件
│   └── styles/        # 样式文件
└── types/             # 类型定义
```

### 1.3 核心模块
1. **翻译服务模块**
   - OpenAI API客户端封装
   - 错误重试机制
   - 响应解析处理

2. **Figma交互模块**
   - 元素选择器
   - 层级遍历器
   - 文本提取器
   - 元素复制器

3. **配置管理模块**
   - 配置存储服务
   - 配置验证器
   - 默认配置管理

4. **UI模块**
   - 右键菜单
   - 进度指示器
   - 错误提示组件

5. **错误处理模块**
   - 全局错误捕获
   - Promise异步错误处理
   - 控制台日志记录
   - 用户友好的错误提示

## 2. 开发规范

### 2.1 代码规范
- 使用ESLint + Prettier进行代码格式化
- 遵循TypeScript严格模式
- 使用函数式编程范式
- 保持代码简洁，遵循SOLID原则
- 实现完整的错误处理机制
- 保持详细的日志记录
- 使用统一的日志前缀标识

### 2.2 命名规范
- 文件名：小写字母，使用连字符(-)
- 组件名：大驼峰命名法
- 函数名：小驼峰命名法
- 常量：大写字母，下划线分隔
- 类型定义：以T或I开头的大驼峰命名

### 2.3 注释规范
- 所有公共API必须包含JSDoc注释
- 复杂逻辑需要添加中文注释说明
- 代码提交前删除调试用的console语句

### 2.4 Git提交规范
- feat: 新功能
- fix: 修复bug
- docs: 文档更新
- style: 代码格式调整
- refactor: 重构
- test: 测试相关
- chore: 构建/工具链相关

## 3. 实现细节

### 3.1 翻译服务实现
```typescript
interface ITranslationService {
  translate(text: string): Promise<string>;
  batchTranslate(texts: string[]): Promise<string[]>;
}

class OpenAITranslationService implements ITranslationService {
  private readonly retryCount = 3;
  private readonly retryDelay = 1000;
  
  async translate(text: string): Promise<string> {
    // 实现单条翻译
  }
  
  async batchTranslate(texts: string[]): Promise<string[]> {
    // 实现批量翻译
  }
}
```

### 3.2 Figma元素处理
```typescript
interface IElementProcessor {
  extractText(element: SceneNode): string[];
  copyElement(element: SceneNode): SceneNode;
  updateTexts(element: SceneNode, translations: Map<string, string>): void;
}
```

### 3.3 配置管理
```typescript
interface IPluginConfig {
  apiKey: string;
  apiEndpoint: string;
  modelName: string;
  retryCount: number;
}

class ConfigManager {
  static async save(config: IPluginConfig): Promise<void> {
    // 实现配置保存
  }
  
  static async load(): Promise<IPluginConfig> {
    // 实现配置加载
  }
}
```

## 4. 测试策略

### 4.1 单元测试
- 使用Jest进行单元测试
- 测试覆盖率要求：
  - 核心业务逻辑 > 90%
  - UI组件 > 80%
  - 工具函数 > 95%

### 4.2 集成测试
- 模拟Figma环境进行测试
- 测试多层级元素处理
- 测试批量翻译功能
- 测试配置管理功能

### 4.3 性能测试
- 批量翻译性能测试
- UI响应速度测试
- 内存占用监控

## 5. 部署流程

### 5.1 构建流程
1. 代码lint检查
2. 类型检查
3. 单元测试
4. 构建打包
5. 生成sourcemap

### 5.2 发布流程
1. 版本号更新
2. 更新日志生成
3. 打包构建
4. 提交Figma审核
5. 发布公告

## 技术资料文档链接

- [项目里程碑](./project_milestones.md)
- [产品文档](./product_doc.md)
- [技术文档](./technical_doc.md)