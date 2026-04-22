TARGET = cat-admin
IMAGE_NAME = cat-admin
CONTAINER_NAME = cat-admin

# ========== 镜像源配置 ==========
# 国内镜像源
NODE_IMAGE_CN = docker.1ms.run/node:24-alpine
CADDY_IMAGE_CN = docker.1ms.run/caddy:alpine
NPM_REGISTRY_CN = https://registry.npmmirror.com

# ========== 构建目标 ==========
# 默认构建（使用国内镜像源，需 podman/docker 支持 buildx）
build-image-cn:
	podman buildx build \
		--build-arg NODE_IMAGE=$(NODE_IMAGE_CN) \
		--build-arg CADDY_IMAGE=$(CADDY_IMAGE_CN) \
		--build-arg NPM_REGISTRY=$(NPM_REGISTRY_CN) \
		-t $(IMAGE_NAME) --format docker .\

build-image:
	podman build -t $(IMAGE_NAME) --format docker .\

clean:
	podman stop $(CONTAINER_NAME) || true
	podman rm -f $(CONTAINER_NAME) || true
	podman rmi -f $(IMAGE_NAME) || true

# 编辑 /etc/sysctl.conf 修改系统参数，将普通用户可绑定的最小端口号下调：
# net.ipv4.ip_unprivileged_port_start=80
# 然后使能：
# sudo sysctl -p
#
# 获取证书：
# podman cp cat-admin:/data/caddy/pki/authorities/local/root.crt ./root.crt
# 修改 hosts 文件：
# Windows: C:\Windows\System32\drivers\etc\hosts
# Linux/macOS: /etc/hosts
run-container:
	podman run -d --network=host -v caddy_data:/data:z --name $(CONTAINER_NAME) --replace $(IMAGE_NAME)

.PHONY: build-image build-image-cn clean run-container
