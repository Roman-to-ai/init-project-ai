/**
 * API 类型统一导出
 */
export * from "./common";

// 登录模块
export * from "./login";
export * from "./menu";

// System 模块
export * from "./system/user";
export * from "./system/role";
export * from "./system/menu";
export * from "./system/dept";
export * from "./system/post";
export * from "./system/dict";
export * from "./system/config";
export * from "./system/notice";

// monitor 模块
export * from "./monitor/cache";
export * from "./monitor/job";
export * from "./monitor/jobLog";
export * from "./monitor/logininfor";
export * from "./monitor/operlog";
export * from "./monitor/online";

// 代码生成模块
export * from "./tool/gen";

// biz 模块
// ⚠️ 新增业务模块后**必须在这里补一行** —— 生成器只给一个 index-bak.ts 作参考，
//    不会自动合并。漏了这步，页面里 import 类型会报错。
export * from "./biz/demoOrder";
export * from "./biz/demoProduct";
export * from "./biz/demoCategory";
export * from "./biz/demoPlan";

// biz 模块
export * from "./biz/demoTag";
