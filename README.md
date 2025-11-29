# 中国高校地图可视化 (China School Map Visualization)

本项目是一款基于 React、ECharts 和 Node.js 的全栈数据可视化项目，旨在通过交互式地图直观展示中国高校的分布情况。

## ⚡️ 界面展示

### 主界面

<img src="/images/pic1.png" alt="主界面预览" width="100%" />

### 数据可视化

| 省份视图 | 市级视图 |
| :---: | :---: |
| <img src="/images/pic2.png" width="100%" alt="省份视图" /> | <img src="/images/pic3.png" width="100%" alt="市级视图" /> |

### 高亮与交互

<img src="/images/pic4.png" alt="高亮交互预览" width="100%" />

## ✨ 功能特性

- **🗺️ 交互式地图**：支持从 **全国** -> **省份** -> **城市** 的三级下钻视图，流畅探索各地高校分布。
- **📊 数据可视化**：利用 ECharts 热力图与散点图，直观展示不同地区的高校密度与数量。
- **🔍 智能筛选**：支持按办学层次（如：全部高校、本科院校、专科院校）进行快速筛选。
- **📈 实时统计**：侧边栏实时更新当前视图区域的统计数据（如高校总数、本科占比等）。
- **📝 响应式列表**：右侧列表同步展示当前区域内的详细高校信息，支持分页与搜索。
- **📱 响应式设计**：适配不同屏幕尺寸，提供良好的浏览体验。

## 🛠 技术栈

| 前端 (Frontend) | 后端 (Backend) |
| :--- | :--- |
| - **框架**：React 18 + TypeScript<br>- **构建工具**：Vite<br>- **可视化库**：ECharts for React<br>- **样式库**：Tailwind CSS<br>- **HTTP 客户端**：Axios | - **运行环境**：Node.js<br>- **框架**：Express<br>- **数据库**：MySQL<br>- **ORM/驱动**：mysql2 |

## 🚀 快速开始

### 前置要求
- Node.js (v16 或更高版本)
- MySQL 5.7 或更高版本

### 数据库设置

1. **创建数据库**

   创建一个名为 `screeningschool_db` 的数据库。

2. **创建数据表**

   执行以下 SQL 语句创建 `schools` 表：

   ```sql
   CREATE TABLE `schools` (
     `id` int unsigned NOT NULL AUTO_INCREMENT,
     `school_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
     `school_code` char(10) COLLATE utf8mb4_unicode_ci NOT NULL,
     `department` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
     `city` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
     `province` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
     `education_level` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
     `notes` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
     PRIMARY KEY (`id`),
     UNIQUE KEY `uq_school_code` (`school_code`)
   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
   ```

3. **导入数据**

   将项目根目录下的 `data/school.csv` 导入到 `schools` 表中。

4. **配置连接**

   修改 `backend/db.js` 文件，填入您的数据库账号密码：

   ```javascript
   export const db = await mysql.createPool({
     host: "localhost",
     user: "root",        // 您的数据库用户名
     password: "password", // 您的数据库密码
     database: "screeningschool_db",
     charset: "utf8mb4"
   });
   ```

### 安装与运行

本项目包含前端和后端两个部分，需要分别启动。

#### 1. 后端服务 (Backend)

```bash
cd backend
npm install      # 安装依赖
node server.js   # 启动服务
# 服务将运行在 http://localhost:3000
```

#### 2. 前端应用 (Frontend)

```bash
cd frontend
npm install      # 安装依赖
npm run dev      # 启动开发服务器
# 应用将运行在 http://localhost:5173
```

## 📂 项目结构

```
├── backend/               # Node.js Express 后端服务
│   ├── db.js             # 数据库连接配置
│   └── server.js         # API 接口定义与业务逻辑
├── frontend/              # React 前端应用
│   ├── src/
│   │   ├── api/          # API 接口封装
│   │   ├── components/   # UI 组件 (地图、统计面板、列表等)
│   │   ├── hooks/        # 自定义 Hooks (如 useMap)
│   │   ├── pages/        # 页面组件 (Home)
│   │   └── types/        # TypeScript 类型定义
│   └── ...
├── data/                 # 数据文件 (如 csv/sql)
├── package.json          # 根目录配置
└── README.md             # 项目说明文档
```

## 🔌 API 接口概览

| 方法 | 路径 | 描述 |
| :--- | :--- | :--- |
| `GET` | `/schools` | 获取所有高校数据 |
| `GET` | `/schools/province/:province` | 根据省份获取高校列表 |
| `GET` | `/schools/city/:city` | 根据城市获取高校列表 |
| `GET` | `/schools/search/:keyword` | 模糊搜索高校（名称/省/市） |
| `GET` | `/schools/stats/province` | 获取各省份高校统计数据 |
| `GET` | `/schools/stats/city/:province` | 获取某省份下各城市高校统计数据 |

## 📝 开源协议

[MIT](./LICENSE.md)
