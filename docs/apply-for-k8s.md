# Apply for Kubernetes

> 📢 Make sure you have set up a Kubernetes cluster and have connected to it.
>
> 📢 Make sure you have read the [k8s-image-pull-secrets.md](./k8s-image-pull-secrets.md) document. `imagePullSecrets` will be used in subsequent operations.

## Replace the Image Pull Credentials

Open the `deployment/base.yaml` file and replace the content at the `.dockerconfigjson` key with your credentials.

> For specific operations, please refer to [k8s-image-pull-secrets.md](./k8s-image-pull-secrets.md)

## Apply Some Basics

> This operation will create a new **Namespace**, **Secret**, and **Service**.

Here, `denostr` will be used as the namespace, `denostr-svc` as the service name, and `ghcr` as the image pull secret name.

```sh
kubectl apply -f deployment/base.yaml
```

## Deploy StatefulSet

> This operation will create a new **StatefulSet** and **ConfigMap**.

Here, `ConfigMap` is used as the startup configuration item. You can customize any parameters in the configuration, but this is not the main job.

As a required dependency for the application, **MongoDB** must be replaced with the environment variable `MONGO_URI` in _**spec.template.spec.containers[].env[].name**_ of the `StatefulSet`.

```sh
kubectl apply -f deployment/worker.yaml
```

Wait a few minutes to ensure that the application is running.

## Verify deployment

```sh
kubectl get sts -n denostr
kubectl get svc -n denostr
kubectl get po -n denostr

# or
kubectl get sts,svc,po -n denostr
```

You should see detailed information about the service and pods in the output.

Congratulations! You have successfully deployed **Denostr** to Kubernetes.

---

> written in ChatGPT
