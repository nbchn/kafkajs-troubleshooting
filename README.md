# Cluster roll / kafkajs troubleshooting

## Start new environment

In order to setup a new environment, execute the following commands:
```
NAMESPACE=confluent
VALUES_FILE=platform-values.yaml
cd env
make download-operator
make create-namespace
make create-env
```
The value file platform-values.yaml contains some values specific to GCP-GKE.

This will create a cluster with:
- 1 Zookeeper
- 10 Kafka

## Deploy application

Build application:
```
cd app
docker build . -t {docker_usr}/node-kafkaproducer
docker push {docker_usr}/node-kafkaproducer
```

Deploy application:
```
cd env
make create-topic
make deploy-app
```
