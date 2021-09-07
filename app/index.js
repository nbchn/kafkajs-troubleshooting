const { Kafka, CompressionTypes, logLevel } = require('kafkajs')

// add timestamps in front of log messages
require('console-stamp')(console, '[HH:MM:ss.l]');

const kafka = new Kafka({
    clientId: 'my-kafkajs-producer',
    brokers: ['kafka-0.kafka.confluent.svc.cluster.local:9071','kafka-1.kafka.confluent.svc.cluster.local:9071','kafka-2.kafka.confluent.svc.cluster.local:9071'],
    //brokers: ['localhost:9092'],
    sasl: {
      mechanism: 'plain', // scram-sha-256 or scram-sha-512
      username: 'test',
      password: 'test123'
    },
    acks:1,
    connectionTimeout: 20000,
    enforceRequestTimeout: true,
    // requestTimeout: 3000,
    logLevel: logLevel.DEBUG,
    // retry: {
    //   initialRetryTime: 100,
    //   retries: 1
    // },
  })

const producer = kafka.producer()
const topic = 'kafkajs'
const admin = kafka.admin()

const { CONNECT, DISCONNECT, REQUEST_TIMEOUT, REQUEST_QUEUE_SIZE } = producer.events;
producer.on(CONNECT, e => console.log(`Producer connected at ${e.timestamp}`));
producer.on(DISCONNECT, e => console.log(`Producer disconnected at ${e.timestamp}`));
producer.on(REQUEST_TIMEOUT, e => console.log(`Producer request timed out at ${e.timestamp}`, JSON.stringify(e.payload)));
// producer.on(REQUEST_QUEUE_SIZE, e => console.log(`Request queue size at ${e.timestamp}`, JSON.stringify(e.payload)));
// producer.logger().setLogLevel(logLevel.DEBUG)

let bigString = '';
for (let i = 0; i < 10; i++) {
  bigString += Math.random().toString(36);
}

const payload = new Array(3).fill({value: bigString});
// const payload = [ { value: bigString} ]

const batch = []

function successCallback(result) {
  console.log("send() finished ");
}

function exceptionCallback(result) {
  // console.error(`[example/producer] ${e.message}`, e)
  console.log("send() failed!  " + result);
}

function addDataToQueue() {
    batch.push({value: bigString})
}

function sendData(dataArray) {
    const now = new Date();
    return producer.send({
        topic: topic,
        messages: dataArray,
        acks: 1,
      }).then(() => {
        console.log('data sent', {count: dataArray.length, duration: new Date() - now});
        return {
            count: dataArray.length,
        }
      }).catch(e => {
        console.log('failed to send data', e);
        throw ({
            error: e,
            count: dataArray.length
        })
      });
}

function splitQueue(queue) {
    var i,j, tmp = [], chunk = 5;
    for (i = 0, j = queue.length; i<j; i += chunk) {
        tmp.push(queue.slice(i, i+chunk))
    }
    batch.length = 0
    return tmp
}

function deQueueBatch() {
  const now = new Date();
  const used = process.memoryUsage().heapUsed / 1024 / 1024;
  console.log(`Memory: ${Math.round(used * 100) / 100} MB`);
  console.log(`Queue size: ${batch.length}`)

  var batches = splitQueue(batch)
  var promises = batches.map(function (events) {
      return sendData(events)
        .catch(function(result) {
            console.log(`Error in sending data`)
            return result
        }).then(function(result) {
            console.log(`Success in sending data`)
            return result
        })
  })

  Promise.allSettled(promises).
  then((results) => results.forEach((result) => console.log(result)));

}

(async function main(){
  await admin.connect()
  await admin.createTopics({
    topics: [{ topic }],
    waitForLeaders: true,
  })
  await producer.connect().catch(e => {
    log.error("failed to producer.connect()", e);
  });
  setInterval(addDataToQueue, 10)
  setInterval(deQueueBatch, 1000, 1000);
})().catch(e => {throw e});