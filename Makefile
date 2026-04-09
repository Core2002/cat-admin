TARGET = cat-admin
IMAGE_NAME = cat-admin
CONTAINER_NAME = cat-admin

build-image:
	podman build -t $(IMAGE_NAME) --format docker .

clean:
	podman stop $(CONTAINER_NAME) || true
	podman rm -f $(CONTAINER_NAME) || true
	podman rmi -f $(IMAGE_NAME) || true

run-container:
	podman run -d --network=host --name $(CONTAINER_NAME) --replace $(IMAGE_NAME) --cap-add=CAP_NET_BIND_SERVICE

.PHONY: build-image clean run-container
