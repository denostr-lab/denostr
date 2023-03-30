# 应用到Kubernetes

> 📢请确保你已经设置了一个Kubernetes集群，并且已经与该集群建立了连接。
>
> 📢请确保你已阅读过 [k8s-image-pull-secrets.md](./k8s-image-pull-secrets.md) 这篇文档，后续操作中会使用到 `imagePullSecrets`

## 替换拉取镜像凭证

打开 `deployment/base.yaml` 文件，将 `.dockerconfigjson` 键值处内容替换为你的凭证。

> 具体操作请看 [k8s-image-pull-secrets.md](./k8s-image-pull-secrets.md)

## 应用一些基础

> 此操作会新建一个 **Namespace**，**Secret**，**Service**

这里将使用 `denostr` 作为命名空间，`denostr-svc` 作为服务名称，`ghcr` 作为镜像拉取密钥名称

```sh
kubectl apply -f deployment/base.yaml
```

## 部署有状态应用

> 此操作会新建一个 **StatefulSet**，**ConfigMap**

这里 `ConfigMap` 用作启动配置项，你可以自定义配置内的任意参数，但这不是主要工作。

**MongoDB** 作为应用程序必须依赖，你必须要替换 `StatefulSet` 中的 _**spec.template.spec.containers[].env[].name**_ 为 `MONGO_URI` 的环境变量

```sh
kubectl apply -f deployment/worker.yaml
```

等待几分钟，以确保应用程序正在运行。

## 验证应用程序已成功部署

```sh
kubectl get sts -n denostr
kubectl get svc -n denostr
kubectl get po -n denostr

# 或者
kubectl get sts,svc,po -n denostr
```

你应该可以看到输出显示服务和Pod的详细信息。

恭喜！你已经成功地将 **Denostr** 部署到Kubernetes上。
