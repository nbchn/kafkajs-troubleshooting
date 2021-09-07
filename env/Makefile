NAMESPACE?=confluent
VALUES_FILE?=platform-values.yaml

create-namespace:
	kubectl create namespace $(NAMESPACE)
	kubectl config set-context --current --namespace=$(NAMESPACE)

download-operator:
	mkdir confluent-operator
	curl https://platform-ops-bin.s3-us-west-1.amazonaws.com/operator/confluent-operator-1.7.0.tar.gz --output confluent-operator/confluent-operator-1.7.0.tar.gz
	cd confluent-operator; tar xvfz confluent-operator-1.7.0.tar.gz

deploy-operator:
	helm upgrade --install \
  operator \
  confluent-operator/helm/confluent-operator/ \
	--values $(VALUES_FILE) \
  --namespace $(NAMESPACE) \
  --set operator.enabled=true

deploy-zookeeper:
	helm upgrade --install \
	  zookeeper \
	  confluent-operator/helm/confluent-operator/ \
	  --values $(VALUES_FILE) \
	  --namespace $(NAMESPACE) \
	  --set zookeeper.enabled=true

deploy-kafka:
	helm upgrade --install \
	  kafka \
	  confluent-operator/helm/confluent-operator/ \
	  --values $(VALUES_FILE) \
	  --namespace $(NAMESPACE) \
	  --set kafka.enabled=true \
	  --set kafka.metricReporter.enabled=true \
	  --set kafka.metricReporter.bootstrapEndpoint="kafka:9071" \
	  --set kafka.oneReplicaPerNode=false

destroy-env:
	kubectl delete namespace $(NAMESPACE)
	# If namespace is stuck in terminiting phase:
	# kubectl get namespace $NAMESPACE -o json > namespace.json
	# Manually delete kubernetes in finalizers list
	# kubectl replace --raw "/api/v1/namespaces/$NAMESPACE/finalize" -f namespace.json


create-env:
	@make deploy-operator
	sleep 15
	@make deploy-zookeeper
	sleep 15
	@make deploy-kafka
	sleep 15


create-topic:
	kubectl cp kafka.properties confluent/kafka-0:/tmp/kafka.properties
	kubectl exec -it kafka-0 -- kafka-topics --bootstrap-server kafka:9071 --command-config /tmp/kafka.properties --topic kafkajs --create --partitions 300 --replication-factor 3

deploy-app:
	kubectl apply -f app-values.yml

stop-app:
	kubectl delete -f app-values.yml

roll-cluster:
	kubectl rollout restart statefulset/kafka --namespace $(NAMESPACE)
