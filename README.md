# CERTIFICATE MANAGER - WEB
竞赛证书上传与审核系统
> CODING...
# Description
前端。面向管理员提供服务。  
技术栈：
* typescript
* 服务器：
    * node.JS
    * Express.JS
* 前端：
    * pug
    * jQuery
    * vue
    * semantic-ui

# Build
1. 配置文件
```bash
cp config.js.example config.js
```
执行此命令，从配置文件模版复制一份文件，并酌情修改。
```
{
    port: number,       //服务器监听的端口
    prefix: string,     //在URL中添加在后续地址前的前缀，详细格式见模版示例
    serverURL: string   //配置后端API服务器的URL，详细格式见模版示例
}
```
2. 安装和编译
```bash
npm install
npm run build-backend
npm run build-frontend
```
3. 运行
```bash
npm run start
```
