import Upscaler from 'upscaler';
const flower = document.getElementById('flower');
const root = document.getElementById('root');
const upscaler = new Upscaler({
  model: '2x',
});
root.innerHTML = 'fooey';
