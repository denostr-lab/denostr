#!/bin/bash

read -r -p 'Place input username: ' username
read -r -p 'Place input personal access token (classic): ' pat
printf "\033c"

token=$(echo -n "$username:$pat" | base64)
content=$(echo -n "{\"auths\":{\"ghcr.io\":{\"auth\":\"$token\"}}}" | base64)

cat <<- EOF
---
kind: Secret
type: kubernetes.io/dockerconfigjson
apiVersion: v1
metadata:
  name: ghcr
  namespace: denostr
  labels:
    component: denostr
data:
  .dockerconfigjson: $content
EOF
