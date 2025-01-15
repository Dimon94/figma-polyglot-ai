# Figma Translator

基于 AI 技术的 Figma 翻译插件，支持批量翻译文本图层。

## 开发规范

1. **代码质量要求**
   - 添加详细的中文注释
   - 实现适当的错误处理和日志记录
   - 代码需具备可复用性、鲁棒性、可测试性、内聚性
   - 遵循 KISS 原则、YAGNI 原则、SOLID 原则

2. **代码提交规范**
   - 提交前进行 ESLint 检查
   - 运行单元测试确保功能正常
   - 提交信息需要清晰描述改动内容

## 本地开发

1. **克隆项目**
```bash
git clone [your-repository-url]
cd figma-translator
```

2. **安装依赖**
```bash
npm install
```

3. **构建项目**
```bash
npm run build
```

4. **在 Figma 中使用**
   - 打开 Figma 桌面应用
   - 右键菜单 -> Plugins -> Development -> Import plugin from manifest...
   - 选择项目中的 manifest.json 文件
   - 插件会出现在你的 Figma 开发菜单中

5. **开发模式**
```bash
npm run dev
```
开发模式下会监听文件变化并自动重新构建。

## 功能特点

- 支持中英文互译
- 批量翻译选中的文本图层
- 保持原始样式和布局
- 自动保存翻译历史
- 支持重新生成历史翻译
- 支持多种 AI 模型（OpenAI、Deepseek 等）
- 支持 SVG 生成和处理
- AI 驱动的 SVG 编辑工具

## 技术特性

- React + TypeScript 开发
- Webpack 优化构建
- 完善的错误处理机制
- 性能监控系统
- 本地存储管理
- 实时状态更新

## 注意事项

- 请确保有足够的 API 额度
- 翻译大量文本时可能需要等待
- 建议定期备份重要的翻译记录

## 隐私说明

- 插件仅在必要时访问 API
- 不会收集用户个人信息
- 翻译记录仅保存在本地

## 支持与反馈

如有问题或建议，请通过以下方式联系：

- 在 GitHub 上提交 Issue
- 发送邮件至：[lovedaih@gmail.com]

## 许可证

MIT License
