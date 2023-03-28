# Image Pull Credentials

> 📢 It is assumed that you are familiar with "**Kubernetes**", "**GitHub personal access tokens**".
>
> 📢 In this document, we will demonstrate the usage of `ghcr.io`, which is the container registry service provided by **GitHub**.

## Generating Image Credentials

Encode `username:personal` access token in **base64 to obtain** the `auth` credential:

```sh
echo -n "USERNAME:PAT_TOKEN" | base64
# output: abcdefghijklmnopqrstuvwxyz
```

Prepare the following content structure:

```json
{
    "auths": {
        "ghcr.io": {
            "auth": "credential generated after base64 encoding"
        }
    }
}
```

Encode it in **base64**:

```sh
echo -n  '{"auths":{"ghcr.io":{"auth":"credential generated after base64 encoding"}}}' | base64
# output: eyJhdXRocyI6eyJnaGNyLmlvIjp7ImF1dGgiOiJiYXNlNjTnvJbnoIHlkI7nlJ/miJDnmoTlh63or4EifX19
```

Create **Kubernetes secret**:

```yaml
kind: Secret
type: kubernetes.io/dockerconfigjson
apiVersion: v1
metadata:
  name: ghcr # the name of the credential
  namespace: denostr # the namespace
data:
  .dockerconfigjson: eyJhdXRocyI6eyJnaGNyLmlvIjp7ImF1dGgiOiJiYXNlNjTnvJbnoIHlkI7nlJ/miJDnmoTlh63or4EifX19
```

### Using ghcr secret to pull images

> There is no guarantee that the deployment will run successfully.

```yaml
apiVersion: v1
kind: Pod
metadata:
  namespace: denostr
  name: denostr
spec:
  containers:
  - name: denostr
    image: ghcr.io/guakamoli/denostr:v0.0.1-worker
    imagePullPolicy: Always
  imagePullSecrets:
  - name: ghcr # use the credential
```

## kubectl create secret

You can also create the secret directly:

```sh
kubectl create secret docker-registry ghcr --docker-server=https://ghcr.io --docker-username=github-username --docker-password=github-personal-access-token --docker-email=your-github-email
```

## Command-Line

You can also try interactive command-line generation of `kubernetes secret` template files:

```sh
bash deployment/k8s-image-pull-secrets.sh
```

---

> written in ChatGPT
