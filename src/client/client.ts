// import * as Cfx from 'fivem-js';

setImmediate(() => {
  emitNet('helloserver');
});

onNet('helloclient', message => {
  console.log(`The server replied: ${message}`);
});
