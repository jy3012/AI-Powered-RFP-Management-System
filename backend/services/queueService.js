const queue = [];
let running = false;


const delayBetweenMs = parseInt(process.env.AI_QUEUE_DELAY_MS || '3000', 10); // 3s default


function runNext() {
if (running || queue.length === 0) return;
running = true;
const job = queue.shift();
job.fn()
.then(job.resolve)
.catch(job.reject)
.finally(() => {
running = false;
setTimeout(runNext, delayBetweenMs);
});
}


function enqueue(fn) {
return new Promise((resolve, reject) => {
queue.push({ fn, resolve, reject });
runNext();
});
}


module.exports = enqueue;