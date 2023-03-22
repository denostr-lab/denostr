# 拉取镜像凭证

> 本文档演示使用到 github 提供的容器注册表服务 `ghcr.io`
> 本文档默认了解 "kubernetes" "github" "个人访问令牌" "base64"

## 镜像凭证生成

将 `用户名:个人访问令牌` 做 **base64编码**，得到 `auth` 凭证

```sh
echo -n "USERNAME:PAT_TOKEN" | base64
# output: abcdefghijklmnopqrstuvwxyz
```

准备如下结构的内容

```json
{
  "auths": {
    "ghcr.io": {
      "auth": "base64编码后生成的凭证"
    }
  }
}
```

进行 **base64编码**

```sh
echo -n  '{"auths":{"ghcr.io":{"auth":"base64编码后生成的凭证"}}}' | base64
# output: eyJhdXRocyI6eyJnaGNyLmlvIjp7ImF1dGgiOiJiYXNlNjTnvJbnoIHlkI7nlJ/miJDnmoTlh63or4EifX19
```

编写一个 **kubernetes secret**

```yaml
kind: Secret
type: kubernetes.io/dockerconfigjson
apiVersion: v1
metadata:
  name: ghcr # 凭证的名称
  namespace: denostr # 命名空间
data:
  .dockerconfigjson: eyJhdXRocyI6eyJnaGNyLmlvIjp7ImF1dGgiOiJiYXNlNjTnvJbnoIHlkI7nlJ/miJDnmoTlh63or4EifX19
```

### 使用 ghcr secret 拉取镜像

```yaml
apiVersion: v1
kind: Pod
metadata:
  namespace: denostr
  name: denostr
spec:
  containers:
  - name: denostr
    image: ghcr.io/username/imagename:latest
    imagePullPolicy: Always
  imagePullSecrets:
  - name: ghcr # 使用凭证
```

## kubectl create secret

也可以更直接一些

```sh
kubectl create secret docker-registry ghcr --docker-server=https://ghcr.io --docker-username=github-username --docker-password=github-personal-access-token --docker-email=your-github-email
```

## 交互式命令行生成

当然你也可以体验交互式命令行生成 `kubernetes secret` 模板文件

```sh
bash deployment/k8s-image-pull-secrets.sh
```
