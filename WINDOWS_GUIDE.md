# Windows系统运行指南

## 项目移动到D盘步骤

### 方法一：直接复制项目到D盘
1. 打开文件资源管理器，找到当前项目所在的目录
2. 复制整个项目文件夹
3. 粘贴到D盘根目录或D盘的任意子目录中

### 方法二：从版本控制系统克隆到D盘
1. 打开命令提示符（CMD）或PowerShell
2. 执行以下命令：
   ```bash
   d:
   cd d:\
   git clone <项目仓库地址> project-name
   cd project-name
   ```

## 安装依赖

1. 打开命令提示符（CMD）或PowerShell，进入项目目录：
   ```bash
   d:
   cd d:\project-name
   ```

2. 安装项目依赖：
   ```bash
   npm install
   ```
   或使用pnpm（如果已安装）：
   ```bash
   pnpm install
   ```

## 运行脚本

### 方法一：使用run.js脚本（推荐）
1. 进入scripts目录：
   ```bash
   cd d:\project-name\scripts
   ```

2. 运行脚本：
   ```bash
   node run.js
   ```
   或带参数运行：
   ```bash
   node run.js --config config.json
   ```

### 方法二：直接使用ts-node
1. 确保已安装ts-node：
   ```bash
   npm install -g ts-node typescript @types/node
   ```

2. 运行脚本：
   ```bash
   cd d:\project-name\scripts
   ts-node runFactorMining.ts
   ```

## 配置文件

1. 复制配置文件示例：
   ```bash
   cd d:\project-name\scripts
   copy config.example.json config.json
   ```

2. 根据需要修改config.json文件中的参数

## 注意事项

1. **路径问题**：在Windows系统中，路径使用反斜杠（\）而不是正斜杠（/）

2. **权限问题**：确保你有D盘的读写权限

3. **依赖问题**：如果遇到依赖安装失败，尝试使用管理员权限运行命令提示符

4. **Node.js版本**：确保安装了Node.js 16.x或更高版本

5. **TypeScript配置**：项目使用TypeScript，确保TypeScript已正确安装

## 常见问题解决

### 问题：ts-node找不到
**解决方法**：运行 `npm install -g ts-node typescript @types/node` 全局安装

### 问题：依赖安装失败
**解决方法**：尝试使用 `npm install --legacy-peer-deps` 或清理npm缓存后重新安装

### 问题：脚本运行时报错
**解决方法**：检查Node.js版本，确保项目依赖已正确安装，查看错误信息并针对性解决

## 联系支持

如果遇到其他问题，请查看项目的README.md文件或联系项目维护者获取帮助。