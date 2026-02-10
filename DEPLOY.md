# 部署到云端服务器

本项目是纯静态前端，数据存在浏览器 localStorage，**本地无需安装 Node、配置环境变量或构建**。

## 本地需要做的

### 1. 确认要上传的文件

只需部署这些文件/目录到服务器即可：

```
index.html
css/
  style.css
js/
  app.js
```

（可选）若服务器用 Git 拉取，可忽略 `.gitignore` 里已排除的文件（如 `.DS_Store`、`*.log`）。

### 2. 二选一：用 Git 还是直接上传

**方式 A：用 Git（推荐）**

- 本地已有仓库时，确保代码已提交并推送到远程（GitHub/GitLab/自建 Git）。
- 服务器上：`git clone` 或 `git pull` 得到最新代码，把网站根目录指到该目录。

**方式 B：直接上传**

- 用 SCP、SFTP、rsync 等把上面列出的文件和目录上传到服务器某一目录，例如 `/var/www/lab-reservation/`。

### 3. 本地无需做的

- 不需要 `npm install` 或任何构建命令。
- 不需要配置 API 地址或环境变量（当前版本无后端接口）。
- 不需要改代码里的路径（`index.html` 里引用的是相对路径 `css/style.css`、`js/app.js`，在任意子路径或根路径都可工作）。

---

## 服务器端需要做的

1. **把网站根目录指到项目目录**  
   例如 Nginx：

   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       root /var/www/lab-reservation;   # 放 index.html 的目录
       index index.html;
       location / {
           try_files $uri $uri/ /index.html;
       }
   }
   ```

2. **若希望用 HTTPS**  
   用 Let’s Encrypt（如 `certbot`）申请证书，并在 Nginx 里配置 `ssl_certificate` / `ssl_certificate_key`。

3. **（可选）缓存静态资源**  
   可为 `css/`、`js/` 加缓存头，例如：

   ```nginx
   location ~* \.(css|js)$ {
       expires 7d;
       add_header Cache-Control "public, immutable";
   }
   ```

部署完成后，用浏览器访问 `http(s)://你的域名/` 即可。  
数据仍在各用户浏览器的 localStorage 中，换设备或清空浏览器数据会丢失；若以后需要多端同步，再考虑加后端和数据库。
