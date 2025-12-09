# Step 2: Generate a TLS certificate for localhost.websocket

Option A: Use mkcert (recommended, easy and trusted locally)

mkcert localhost.websocket
This will generate:

localhost.websocket.pem (certificate)

localhost.websocket-key.pem (private key)

kubectl -n sempreiotnew create secret tls websocket-tls --cert=localhost.websocket.pem --key=localhost.websocket-key.pem

# Run NATS locally MINIKUBE

kubectl port-forward svc/nats 4222:4222
