/*
  БАКЕТЫ РЕНДЕРА
  Холст поверх кадра: тайлы «досчитываются» от центра по спирали, как бакеты
  в Blender. Пока бакет считается — в нём редкий шум недосэмплинга и уголки
  рамки; до своей очереди тайл закрыт чёрным. Один холст — один кадр.
  Холст живёт в rAF только пока идёт рендер.
*/
const UV = '#8C74FF';

export function createBuckets(canvas, { size = 44, active = 4 } = {}) {
  const g = canvas.getContext('2d');
  let w = 0, h = 0, dpr = 1, order = [], done = 0, speed = 1, raf = 0, onTick = null, onEnd = null;

  function layout() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    w = canvas.clientWidth; h = canvas.clientHeight;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    const cols = Math.ceil(w / size), rows = Math.ceil(h / size);
    const cx = (cols - 1) / 2, cy = (rows - 1) / 2;
    order = [];
    // порядок: квадратные кольца от центра, внутри кольца — по углу
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      order.push({ x: x * size, y: y * size, k: Math.max(Math.abs(x - cx), Math.abs(y - cy)) + Math.atan2(y - cy, x - cx) / 6.3 + 0.5 });
    }
    order.sort((a, b) => a.k - b.k);
  }

  function paint() {
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, w, h);
    const first = Math.floor(done);
    for (let i = first; i < order.length; i++) {
      const { x, y } = order[i];
      if (i < first + active) {
        // бакет в работе: затемнён, редкие сэмплы и уголки рамки
        g.fillStyle = 'rgba(0,0,0,.55)'; g.fillRect(x, y, size, size);
        g.fillStyle = 'rgba(160,140,255,.38)';
        for (let k = 0; k < 26; k++) g.fillRect(x + Math.random() * size, y + Math.random() * size, 1.4, 1.4);
        g.strokeStyle = UV; g.lineWidth = 1;
        g.beginPath();
        const s = size, c = 7;
        g.moveTo(x + c, y); g.lineTo(x, y); g.lineTo(x, y + c);
        g.moveTo(x + s - c, y); g.lineTo(x + s, y); g.lineTo(x + s, y + c);
        g.moveTo(x, y + s - c); g.lineTo(x, y + s); g.lineTo(x + c, y + s);
        g.moveTo(x + s - c, y + s); g.lineTo(x + s, y + s); g.lineTo(x + s, y + s - c);
        g.stroke();
      } else {
        g.fillStyle = '#000'; g.fillRect(x, y, size + 0.5, size + 0.5);
      }
    }
  }

  function step() {
    done = Math.min(order.length, done + speed);
    paint();
    onTick?.(done / order.length);
    if (done < order.length) raf = requestAnimationFrame(step);
    else { raf = 0; onEnd?.(); }
  }

  return {
    // досчитать кадр за ms миллисекунд
    run(ms = 900, { tick, end } = {}) {
      cancelAnimationFrame(raf);
      layout();
      onTick = tick; onEnd = end;
      done = 0;
      speed = Math.max(1, order.length / Math.max(1, ms / 16.7));
      paint();
      raf = requestAnimationFrame(step);
    },
    // закрыть кадр чёрным до начала рендера
    cover() { cancelAnimationFrame(raf); raf = 0; layout(); done = 0; paint(); },
    // сразу готовый кадр
    finish() { cancelAnimationFrame(raf); raf = 0; layout(); done = order.length; paint(); onTick?.(1); },
  };
}
