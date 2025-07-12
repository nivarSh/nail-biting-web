### Production
`docker build -f prod.Dockerfile -t nail-prod .`
`docker run -p 3000:80 nail-prod`

### Development
`docker build -f dev.Dockerfile -t nail-dev .`
```
docker run \
  -p 5173:5173 \
  -v ${PWD}:/app \
  -v /app/node_modules \
  -e CHOKIDAR_USEPOLLING=true \
  nail-dev
  ```